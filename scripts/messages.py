"""Generate catalogs in isolation; --check compares without modifying sources.

Usage (from the repository root):
    uv run --extra test python scripts/messages.py
    uv run --extra test python scripts/messages.py --check
"""

import os
import re
import shutil
import sys
from pathlib import Path
from tempfile import TemporaryDirectory

import django
from django.conf import settings
from django.core.management import call_command
from django.core.management.commands.makemessages import Command as MakeMessagesCommand

ROOT = Path(__file__).resolve().parents[1]
PACKAGE = ROOT / "cast_bootstrap5"
LOCALES = ["de"]
CATALOGS = [PACKAGE / "locale" / locale / "LC_MESSAGES" / "django.po" for locale in LOCALES]
CREATION_DATE = re.compile(rb'^"POT-Creation-Date: .*"$', re.MULTILINE)


class MakeMessages(MakeMessagesCommand):
    # Leave new msgids untranslated instead of guessing fuzzy matches.
    msgmerge_options = [*MakeMessagesCommand.msgmerge_options, "--no-fuzzy-matching"]


def generate(staged: Path) -> None:
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
            old_date = CREATION_DATE.search(source.read_bytes()) if source.exists() else None
            if old_date:
                po.write_bytes(CREATION_DATE.sub(lambda _: old_date.group(), po.read_bytes()))
            po.with_suffix(".mo").unlink(missing_ok=True)
        call_command("compilemessages", locale=LOCALES, verbosity=0)
    finally:
        os.chdir(previous_cwd)


def publish(staged: Path, backup: Path, paths: list[Path]) -> None:
    published = []
    try:
        for relative in paths:
            target = PACKAGE / relative
            target.parent.mkdir(parents=True, exist_ok=True)
            published.append(relative)
            os.replace(staged / relative, target)
    except BaseException as error:
        # All generation has already succeeded. Restore any earlier publications
        # if a later replace fails, including a caught KeyboardInterrupt.
        for relative in reversed(published):
            try:
                original = backup / relative
                if original.exists():
                    os.replace(original, PACKAGE / relative)
                else:
                    (PACKAGE / relative).unlink()
            except OSError as rollback_error:
                error.add_note(f"Could not restore {relative}: {rollback_error}")
        raise


def main(check: bool) -> int:
    if not settings.configured:
        settings.configure(USE_I18N=True)
    django.setup()
    paths = [source.with_suffix(suffix).relative_to(PACKAGE) for source in CATALOGS for suffix in (".po", ".mo")]
    # A sibling temporary tree keeps publication on the same filesystem.
    with TemporaryDirectory(prefix=".messages-", dir=PACKAGE.parent) as temporary:
        temporary = Path(temporary)
        staged, backup = temporary / "package", temporary / "backup"
        shutil.copytree(PACKAGE, staged, ignore=shutil.ignore_patterns("static", "__pycache__", "*.pyc"))
        for relative in paths:
            source = PACKAGE / relative
            if source.exists():
                saved = backup / relative
                saved.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(source, saved)
        generate(staged)
        # Read the complete result before publishing any member of the set.
        expected = {relative: (staged / relative).read_bytes() for relative in paths}
        if check:
            stale = any(
                not (PACKAGE / path).exists() or (PACKAGE / path).read_bytes() != data
                for path, data in expected.items()
            )
            if stale:
                print("Translation catalog is stale: run `just messages` and commit the result.", file=sys.stderr)
            return int(stale)
        publish(staged, backup, paths)
    return 0


if __name__ == "__main__":
    sys.exit(main(check="--check" in sys.argv[1:]))
