"""Generate catalogs in isolation; --check compares without modifying sources.

Usage (from the repository root):
    uv run --extra test python scripts/messages.py
    uv run --extra test python scripts/messages.py --check
"""

import fcntl
import hashlib
import os
import re
import shutil
import stat
import sys
from collections.abc import Iterable
from contextlib import contextmanager, nullcontext, suppress
from pathlib import Path
from tempfile import TemporaryDirectory, mkdtemp
from typing import BinaryIO, NamedTuple

import django
from django.conf import settings
from django.core.management import call_command
from django.core.management.commands.makemessages import Command as MakeMessagesCommand

ROOT = Path(__file__).resolve().parents[1]
PACKAGE = ROOT / "cast_bootstrap5"
LOCALES = ["de"]
CATALOGS = [PACKAGE / "locale" / locale / "LC_MESSAGES" / "django.po" for locale in LOCALES]
MAX_SOURCE_FILE_BYTES = 8 * 1024 * 1024
MAX_SOURCE_TOTAL_BYTES = 64 * 1024 * 1024
DIGEST_CHUNK_BYTES = 64 * 1024
CREATION_DATE = re.compile(rb'^"POT-Creation-Date: .*"$', re.MULTILINE)


class Generation(NamedTuple):
    device: int
    inode: int
    size: int
    mtime_ns: int
    mode: int
    digest: bytes


class MakeMessages(MakeMessagesCommand):
    # Leave new msgids untranslated instead of guessing fuzzy matches.
    msgmerge_options = [*MakeMessagesCommand.msgmerge_options, "--no-fuzzy-matching"]


class SourcesChanged(RuntimeError):
    def __init__(self):
        super().__init__("Translation sources changed during generation/publication; rerun `just messages`.")


class SourceBudgetExceeded(RuntimeError):
    pass


class UnsupportedSource(RuntimeError):
    def __init__(self, path: Path):
        super().__init__(f"Translation source is not a regular file: {path}")


@contextmanager
def publication_lock():
    # A stable inode outside the package, shared by checks and writers. Never
    # unlink the lock: waiters must not acquire a different inode.
    lock = PACKAGE.parent / ".cache/messages.lock"
    lock.parent.mkdir(exist_ok=True)
    with lock.open("a+b") as handle:
        fcntl.flock(handle, fcntl.LOCK_EX)
        try:
            yield
        finally:
            fcntl.flock(handle, fcntl.LOCK_UN)


def generation(path: Path, remaining_total: int, *, destination: BinaryIO | None = None) -> Generation | None:
    try:
        try:
            descriptor = os.open(path, os.O_RDONLY | os.O_NONBLOCK)
        except OSError:
            # Some special files, such as Unix sockets, cannot be opened.
            if not stat.S_ISREG(path.stat().st_mode):
                raise UnsupportedSource(path) from None
            raise
        try:
            before = os.fstat(descriptor)
            if not stat.S_ISREG(before.st_mode):
                raise UnsupportedSource(path)
            if before.st_size > MAX_SOURCE_FILE_BYTES:
                raise SourceBudgetExceeded(f"Translation per-file limit ({MAX_SOURCE_FILE_BYTES} bytes): {path}")
            if before.st_size > remaining_total:
                raise SourceBudgetExceeded(f"Translation aggregate limit ({MAX_SOURCE_TOTAL_BYTES} bytes): {path}")
            digest = hashlib.sha256()
            remaining = before.st_size
            while remaining:
                chunk = os.read(descriptor, min(DIGEST_CHUNK_BYTES, remaining))
                if not chunk:
                    raise SourcesChanged()
                digest.update(chunk)
                if destination is not None:
                    destination.write(chunk)
                remaining -= len(chunk)
            after = os.fstat(descriptor)
        finally:
            os.close(descriptor)
    except FileNotFoundError:
        return None
    if (before.st_size, before.st_mtime_ns, before.st_ctime_ns) != (
        after.st_size,
        after.st_mtime_ns,
        after.st_ctime_ns,
    ):
        raise SourcesChanged()
    if destination is not None:
        destination.flush()
        os.fchmod(destination.fileno(), stat.S_IMODE(before.st_mode))
        os.utime(destination.fileno(), ns=(before.st_atime_ns, before.st_mtime_ns))
    # Rename preserves these fields; inode identity also fences an editor's
    # atomic save of identical bytes. The digest catches in-place edits.
    return Generation(
        after.st_dev, after.st_ino, after.st_size, after.st_mtime_ns, stat.S_IMODE(after.st_mode), digest.digest()
    )


def generations(root: Path, inputs: Iterable[Path]) -> dict[Path, Generation | None]:
    result = {}
    remaining = MAX_SOURCE_TOTAL_BYTES
    for relative in sorted(inputs):
        fingerprint = generation(root / relative, remaining)
        result[relative] = fingerprint
        if fingerprint is not None:
            remaining -= fingerprint.size
    return result


def source_generations(paths: list[Path]) -> dict[Path, Generation | None]:
    inputs = set(paths)
    for path in PACKAGE.rglob("*"):
        if path.suffix in {".html", ".txt", ".py"}:
            relative = path.relative_to(PACKAGE)
            if not any(part in {"static", "__pycache__"} or part.endswith(".pyc") for part in relative.parts):
                inputs.add(relative)
    return generations(PACKAGE, inputs)


def ensure_current(expected: dict, paths: list[Path]) -> None:
    if source_generations(paths) != expected:
        raise SourcesChanged()


def stage_sources(staged: Path, initial: dict[Path, Generation | None], paths: list[Path]) -> None:
    # Django needs the locale directory even when regenerating missing catalogs.
    for relative in paths:
        (staged / relative).parent.mkdir(parents=True, exist_ok=True)
    for relative, expected in initial.items():
        if expected is None:
            continue
        target = staged / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        with target.open("wb") as destination:
            try:
                actual = generation(PACKAGE / relative, expected.size, destination=destination)
            except SourceBudgetExceeded as error:
                raise SourcesChanged() from error
        if actual != expected:
            raise SourcesChanged()


def generate(staged: Path) -> None:
    dates = {
        source: (
            CREATION_DATE.search((staged / source.relative_to(PACKAGE)).read_bytes())
            if (staged / source.relative_to(PACKAGE)).exists()
            else None
        )
        for source in CATALOGS
    }
    previous_cwd = Path.cwd()
    try:
        os.chdir(staged)
        call_command(
            MakeMessages(),
            locale=LOCALES,
            domain="django",
            ignore_patterns=["static/*"],
            add_location="file",
            no_obsolete=True,
            verbosity=0,
        )
        for source in CATALOGS:
            po = staged / source.relative_to(PACKAGE)
            # Preserve only the volatile extraction timestamp, before compiling
            # so the PO/MO pair is deterministic and can be compared bytewise.
            old_date = dates[source]
            if old_date:
                po.write_bytes(CREATION_DATE.sub(lambda _: old_date.group(), po.read_bytes()))
            po.with_suffix(".mo").unlink(missing_ok=True)
        call_command("compilemessages", locale=LOCALES, verbosity=0)
    finally:
        os.chdir(previous_cwd)


@contextmanager
def catalog_backups(staged: Path, paths: list[Path], initial: dict):
    # Recovery copies start in their final location so retention needs no
    # additional filesystem writes after a failed restore.
    directory = Path(mkdtemp(prefix="messages-recovery-", dir=PACKAGE.parent / ".cache"))
    backups = {}
    retained = set()
    failure = None

    def report_cleanup_error(path, error):
        note = f"Could not clean translation backup path {path}: {error}"
        if failure is not None:
            failure.add_note(note)
        else:
            with suppress(Exception):
                print(note, file=sys.stderr)

    try:
        for relative in paths:
            if initial[relative] is not None:
                saved = directory / relative
                saved.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(staged / relative, saved)
                backups[relative] = saved
        yield backups, retained
    except BaseException as error:
        failure = error
        raise
    finally:
        if retained:
            for relative in backups.keys() - retained:
                saved = backups[relative]
                try:
                    saved.unlink(missing_ok=True)
                except OSError as error:
                    report_cleanup_error(saved, error)
        elif sys.version_info >= (3, 12):
            shutil.rmtree(directory, onexc=lambda _function, path, error: report_cleanup_error(path, error))
        else:
            shutil.rmtree(directory, onerror=lambda _function, path, exc_info: report_cleanup_error(path, exc_info[1]))


def publish(staged: Path, backups: dict, retained: set, paths: list[Path], expected: dict, owned: dict) -> None:
    published = []
    try:
        for relative in paths:
            ensure_current(expected, paths)
            target = PACKAGE / relative
            target.parent.mkdir(parents=True, exist_ok=True)
            published.append(relative)
            os.replace(staged / relative, target)
            expected[relative] = owned[relative]
        ensure_current(expected, paths)
    except BaseException as error:
        # Roll back only files that still hold this attempt's content. A later
        # translator save keeps the file; a permission-only change is carried
        # over to the restored original so the PO/MO pair stays consistent.
        for relative in reversed(published):
            target = PACKAGE / relative
            original = backups.get(relative)
            try:
                current = generation(target, MAX_SOURCE_TOTAL_BYTES)
                # A deleted catalog (None) belongs to whoever removed it.
                if current is None or current._replace(mode=owned[relative].mode) != owned[relative]:
                    continue
            except (OSError, SourcesChanged, SourceBudgetExceeded, UnsupportedSource) as rollback_error:
                # The target may still hold this attempt's bytes, so keep the
                # original copy instead of deleting the only recovery source.
                note = f"Could not verify rollback ownership of {relative}: {rollback_error}"
                if original is not None:
                    retained.add(relative)
                    note += f". Original catalog retained at {original}"
                error.add_note(note)
                continue
            try:
                if original is not None:
                    if current.mode != owned[relative].mode:
                        os.chmod(original, current.mode)
                    os.replace(original, target)
                else:
                    target.unlink()
            except OSError as rollback_error:
                note = f"Could not restore {relative}: {rollback_error}"
                if original is not None:
                    retained.add(relative)
                    note += f". Original catalog retained at {original}"
                error.add_note(note)
        raise


def main(check: bool) -> int:
    if not settings.configured:
        settings.configure(USE_I18N=True)
    django.setup()
    paths = [source.with_suffix(suffix).relative_to(PACKAGE) for source in CATALOGS for suffix in (".po", ".mo")]
    with publication_lock():
        initial = source_generations(paths)
        # A sibling temporary tree keeps publication on the same filesystem.
        with TemporaryDirectory(prefix=".messages-", dir=PACKAGE.parent) as temporary:
            staged = Path(temporary) / "package"
            stage_sources(staged, initial, paths)
            backup_context = nullcontext(({}, set())) if check else catalog_backups(staged, paths, initial)
            with backup_context as (backups, retained):
                ensure_current(initial, paths)
                generate(staged)
                # Fingerprint the complete result before publishing any member of the set.
                owned = {}
                for relative, fingerprint in generations(staged, paths).items():
                    if fingerprint is None:
                        raise FileNotFoundError(staged / relative)
                    owned[relative] = fingerprint
                ensure_current(initial, paths)
                if check:
                    stale = any(
                        (original := initial[path]) is None or original.digest != owned[path].digest for path in paths
                    )
                    if stale:
                        print(
                            "Translation catalog is stale: run `just messages` and commit the result.", file=sys.stderr
                        )
                    return int(stale)
                publish(staged, backups, retained, paths, initial.copy(), owned)
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main(check="--check" in sys.argv[1:]))
    except (SourcesChanged, SourceBudgetExceeded, UnsupportedSource) as error:
        print(error, *getattr(error, "__notes__", ()), sep="\n", file=sys.stderr)
        sys.exit(1)
