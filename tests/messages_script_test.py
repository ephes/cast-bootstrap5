"""Catalog generation never uses translator-owned files as scratch space."""

import importlib.util
import os
import shutil
import subprocess
import sys
from pathlib import Path
from types import SimpleNamespace

import pytest

SPEC = importlib.util.spec_from_file_location("theme_messages", Path(__file__).parents[1] / "scripts/messages.py")
messages = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(messages)


@pytest.fixture
def package(tmp_path, monkeypatch):
    package = tmp_path / "cast_bootstrap5"
    catalogs = package / "locale/de/LC_MESSAGES"
    catalogs.mkdir(parents=True)
    (catalogs / "django.po").write_bytes(b"translator edits\n")
    (catalogs / "django.mo").write_bytes(b"compiled translator edits\n")
    (package / "templates").mkdir()
    (package / "templates/test.html").write_text("{% translate 'New string' %}")
    monkeypatch.setattr(messages, "PACKAGE", package)
    monkeypatch.setattr(messages, "CATALOGS", [catalogs / "django.po"])
    monkeypatch.chdir(tmp_path)
    return package


def snapshot(package):
    return {p.relative_to(package): p.read_bytes() for p in package.rglob("*") if p.is_file()}


@pytest.mark.parametrize("args", [[], ["--check"]], ids=["update", "check"])
def test_cli_rejects_a_fifo_template(package, args):
    template = package / "templates/fifo.html"
    os.mkfifo(template)
    script = package.parent / "scripts/messages.py"
    script.parent.mkdir()
    shutil.copyfile(SPEC.origin, script)

    result = subprocess.run([sys.executable, str(script), *args], capture_output=True, text=True, timeout=5)

    assert result.returncode == 1
    assert "not a regular file" in result.stderr
    assert str(template) in result.stderr
    assert "Traceback" not in result.stderr


@pytest.mark.parametrize("check", [True, False])
@pytest.mark.parametrize("failure", ["extract", "compile", "interrupt"])
def test_generation_failure_preserves_source(package, monkeypatch, check, failure):
    before = snapshot(package)
    cwd = Path.cwd()

    def command(name, **kwargs):
        catalog = Path("locale/de/LC_MESSAGES/django.po")
        catalog.write_bytes(b"partial extraction")
        if not isinstance(name, str) and failure == "extract":
            raise RuntimeError("extract failed")
        if isinstance(name, str):
            Path("locale/de/LC_MESSAGES/django.mo").write_bytes(b"partial compile")
            if failure == "interrupt":
                raise KeyboardInterrupt()
            raise RuntimeError("compile failed")

    monkeypatch.setattr(messages, "call_command", command)
    # Isolate Django setup from the filesystem failure injection.
    monkeypatch.setattr(messages, "settings", SimpleNamespace(configured=False, configure=lambda **kwargs: None))
    monkeypatch.setattr(messages.django, "setup", lambda: None)
    with pytest.raises((RuntimeError, KeyboardInterrupt)):
        messages.main(check)
    assert snapshot(package) == before
    assert Path.cwd() == cwd


def test_stale_check_is_read_only_and_update_publishes_matching_pair(package, monkeypatch):
    before = snapshot(package)

    def command(name, **kwargs):
        if isinstance(name, str):
            po = Path("locale/de/LC_MESSAGES/django.po").read_bytes()
            Path("locale/de/LC_MESSAGES/django.mo").write_bytes(b"compiled " + po)
        else:
            Path("locale/de/LC_MESSAGES/django.po").write_bytes(b"translator edits + new string\n")

    monkeypatch.setattr(messages, "call_command", command)
    monkeypatch.setattr(messages, "settings", SimpleNamespace(configured=False, configure=lambda **kwargs: None))
    monkeypatch.setattr(messages.django, "setup", lambda: None)
    assert messages.main(True) == 1
    assert snapshot(package) == before
    assert messages.main(False) == 0
    catalogs = package / "locale/de/LC_MESSAGES"
    assert (catalogs / "django.mo").read_bytes() == b"compiled " + (catalogs / "django.po").read_bytes()
    assert messages.main(True) == 0


@pytest.mark.parametrize("failure", [OSError, KeyboardInterrupt])
def test_publication_failure_restores_complete_pair(package, monkeypatch, failure):
    before = snapshot(package)

    def command(name, **kwargs):
        suffix = ".mo" if isinstance(name, str) else ".po"
        Path("locale/de/LC_MESSAGES/django" + suffix).write_bytes(b"new catalog")

    monkeypatch.setattr(messages, "call_command", command)
    monkeypatch.setattr(messages, "settings", SimpleNamespace(configured=False, configure=lambda **kwargs: None))
    monkeypatch.setattr(messages.django, "setup", lambda: None)
    replace = messages.os.replace
    failed = False

    def fail_second(source, target):
        nonlocal failed
        if not failed and Path(target) == package / "locale/de/LC_MESSAGES/django.mo":
            failed = True
            raise failure("publication interrupted")
        return replace(source, target)

    monkeypatch.setattr(messages.os, "replace", fail_second)
    with pytest.raises(failure):
        messages.main(False)
    assert snapshot(package) == before
    assert list((package.parent / ".cache").iterdir()) == [package.parent / ".cache/messages.lock"]


def test_failed_restore_retains_only_the_owned_backup(package, monkeypatch):
    before = snapshot(package)
    po = Path("locale/de/LC_MESSAGES/django.po")
    mo = po.with_suffix(".mo")
    failure = OSError("second publication failed")
    replace = messages.os.replace

    def generate(staged):
        (staged / po).write_bytes(b"generated PO")
        (staged / mo).write_bytes(b"generated MO")

    def fail_publication_and_restore(source, target):
        if target == package / mo:
            raise failure
        if target == package / po and Path(source).read_bytes() == before[po]:
            raise OSError("restore failed")
        replace(source, target)

    monkeypatch.setattr(messages, "generate", generate)
    monkeypatch.setattr(messages.os, "replace", fail_publication_and_restore)
    with pytest.raises(OSError, match="second publication failed") as caught:
        messages.main(False)

    assert caught.value is failure
    cache = package.parent / ".cache"
    saved = [path for path in cache.rglob("*") if path.is_file() and path.name != "messages.lock"]
    assert len(saved) == 1
    assert saved[0].read_bytes() == before[po]
    assert any("restore failed" in note and str(saved[0]) in note for note in failure.__notes__)
    assert snapshot(package) == {**before, po: b"generated PO"}
    assert not list(package.parent.glob(".messages-*"))


def test_unverifiable_rollback_ownership_retains_the_backup(package, monkeypatch):
    before = snapshot(package)
    po = Path("locale/de/LC_MESSAGES/django.po")
    mo = po.with_suffix(".mo")
    failure = OSError("second publication failed")
    replace = messages.os.replace
    generation = messages.generation

    def generate(staged):
        (staged / po).write_bytes(b"generated PO")
        (staged / mo).write_bytes(b"generated MO")

    def fail_publication(source, target):
        if target == package / mo:
            raise failure
        replace(source, target)

    def fail_rollback_check(path, remaining_total, **kwargs):
        if failure.__traceback__ is not None and path == package / po:
            raise OSError("ownership check failed")
        return generation(path, remaining_total, **kwargs)

    monkeypatch.setattr(messages, "generate", generate)
    monkeypatch.setattr(messages.os, "replace", fail_publication)
    monkeypatch.setattr(messages, "generation", fail_rollback_check)
    with pytest.raises(OSError, match="second publication failed"):
        messages.main(False)

    cache = package.parent / ".cache"
    saved = [path for path in cache.rglob("*") if path.is_file() and path.name != "messages.lock"]
    assert len(saved) == 1
    assert saved[0].read_bytes() == before[po]
    assert any("ownership check failed" in note and str(saved[0]) in note for note in failure.__notes__)
    assert snapshot(package) == {**before, po: b"generated PO"}


def test_real_gettext_stages_translations_and_detects_mo_drift(package, monkeypatch):
    import gettext

    if not all(shutil.which(tool) for tool in ("msgmerge", "msgfmt", "xgettext")):
        pytest.skip("GNU gettext is required")
    catalogs = package / "locale/de/LC_MESSAGES"
    source = Path(__file__).parents[1] / "cast_bootstrap5/locale/de/LC_MESSAGES"
    for suffix in (".po", ".mo"):
        shutil.copy2(source / ("django" + suffix), catalogs)
    template = package / "templates/test.html"
    template.write_text("{% load i18n %}{% translate 'Skip to content' %}{% translate 'Synthetic new string' %}")
    before = snapshot(package)
    assert messages.main(True) == 1
    assert snapshot(package) == before
    assert messages.main(False) == 0
    with (catalogs / "django.mo").open("rb") as handle:
        compiled = gettext.GNUTranslations(handle)
    assert compiled.gettext("Skip to content") == "Zum Inhalt springen"
    assert 'msgid "Synthetic new string"' in (catalogs / "django.po").read_text()
    assert messages.main(True) == 0

    admitted = snapshot(package)
    unrelated = package / "unrelated.bin"
    with unrelated.open("wb") as handle:
        handle.truncate(messages.MAX_SOURCE_FILE_BYTES + 1)
    generate = messages.generate

    def generate_from_admitted_sources(staged):
        assert {path.relative_to(staged) for path in staged.rglob("*") if path.is_file()} == admitted.keys()
        assert snapshot(staged) == admitted
        generate(staged)

    with monkeypatch.context() as staging:
        staging.setattr(messages, "generate", generate_from_admitted_sources)
        assert messages.main(True) == 0
        assert messages.main(False) == 0
    assert unrelated.stat().st_size == messages.MAX_SOURCE_FILE_BYTES + 1
    unrelated.unlink()
    assert snapshot(package) == admitted

    (catalogs / "django.mo").write_bytes(b"stale compiled catalog")
    before = snapshot(package)
    assert messages.main(True) == 1
    assert snapshot(package) == before


@pytest.mark.parametrize("check", [False, True])
def test_translator_save_during_generation_is_preserved(package, monkeypatch, check):
    po = package / "locale/de/LC_MESSAGES/django.po"
    mo = po.with_suffix(".mo")
    original_mo = mo.read_bytes()

    def generate(staged):
        (staged / po.relative_to(package)).write_bytes(b"generated translation")
        (staged / mo.relative_to(package)).write_bytes(b"generated binary")
        po.write_bytes(b"concurrent translator save")

    monkeypatch.setattr(messages, "generate", generate)
    with pytest.raises(RuntimeError, match="changed"):
        messages.main(check)
    assert po.read_bytes() == b"concurrent translator save"
    assert mo.read_bytes() == original_mo


@pytest.mark.parametrize("atomic_save", [False, True])
def test_translator_save_between_publications_refuses_stale_set(package, monkeypatch, atomic_save):
    po = package / "locale/de/LC_MESSAGES/django.po"
    mo = po.with_suffix(".mo")
    original_mo = mo.read_bytes()

    def generate(staged):
        for source in (po, mo):
            (staged / source.relative_to(package)).write_bytes(b"generated")

    monkeypatch.setattr(messages, "generate", generate)
    replace = messages.os.replace

    def save_after_first(source, target):
        replace(source, target)
        if Path(target) == po:
            if atomic_save:
                saved = po.with_suffix(".saved")
                saved.write_bytes(b"concurrent translator save")
                replace(saved, po)
            else:
                po.write_bytes(b"concurrent translator save")

    monkeypatch.setattr(messages.os, "replace", save_after_first)
    with pytest.raises(RuntimeError, match="changed"):
        messages.main(False)
    assert po.read_bytes() == b"concurrent translator save"
    assert mo.read_bytes() == original_mo


@pytest.mark.parametrize("atomic_save", [False, True])
def test_failed_publication_does_not_roll_back_a_translator_save(package, monkeypatch, atomic_save):
    po = package / "locale/de/LC_MESSAGES/django.po"
    mo = po.with_suffix(".mo")
    original_mo = mo.read_bytes()

    def generate(staged):
        for source in (po, mo):
            (staged / source.relative_to(package)).write_bytes(b"generated")

    monkeypatch.setattr(messages, "generate", generate)
    replace = messages.os.replace

    def fail_second(source, target):
        if Path(target) == mo:
            if atomic_save:
                # Even saving the generated bytes transfers ownership to the
                # translator: rollback must not put the older PO back.
                saved = po.with_suffix(".saved")
                saved.write_bytes(po.read_bytes())
                replace(saved, po)
            else:
                po.write_bytes(b"translator save just before failure")
            raise OSError("publication failed")
        replace(source, target)

    monkeypatch.setattr(messages.os, "replace", fail_second)
    with pytest.raises(OSError, match="publication failed"):
        messages.main(False)
    assert po.read_bytes() == (b"generated" if atomic_save else b"translator save just before failure")
    assert mo.read_bytes() == original_mo


@pytest.mark.parametrize("limit", ["per-file", "aggregate"])
def test_oversized_sources_are_refused_before_staging(package, monkeypatch, limit):
    oversized = package / "templates/oversized.html"
    with oversized.open("wb") as handle:
        handle.truncate(1024 * 1024 if limit == "per-file" else 4096)
    monkeypatch.setattr(
        messages, "MAX_SOURCE_FILE_BYTES", 4096 if limit == "per-file" else 2 * 1024 * 1024, raising=False
    )
    monkeypatch.setattr(
        messages, "MAX_SOURCE_TOTAL_BYTES", 2 * 1024 * 1024 if limit == "per-file" else 4096, raising=False
    )

    def unexpected_staging(*args, **kwargs):
        pytest.fail("staging was created before input admission")

    original_read = os.read
    bytes_read = 0

    def track_reads(descriptor, size):
        nonlocal bytes_read
        data = original_read(descriptor, size)
        bytes_read += len(data)
        assert bytes_read <= 4096
        return data

    before = snapshot(package)
    monkeypatch.setattr(os, "read", track_reads)
    monkeypatch.setattr(messages, "TemporaryDirectory", unexpected_staging)
    with pytest.raises(RuntimeError, match=f"{limit}.*oversized.html"):
        messages.main(False)
    monkeypatch.undo()
    assert snapshot(package) == before


def test_same_size_translator_rewrite_with_restored_mtime_is_detected(package, monkeypatch):
    po = package / "locale/de/LC_MESSAGES/django.po"
    before = po.stat()
    original = po.read_bytes()

    def generate(staged):
        po.write_bytes(b"x" * len(original))
        messages.os.utime(po, ns=(before.st_atime_ns, before.st_mtime_ns))

    monkeypatch.setattr(messages, "generate", generate)
    with pytest.raises(messages.SourcesChanged):
        messages.main(False)
    assert po.read_bytes() == b"x" * len(original)


def test_new_template_during_generation_refuses_stale_output(package, monkeypatch):
    before = snapshot(package)

    def generate(staged):
        (package / "templates/new.html").write_text("{% translate 'Concurrent string' %}")

    monkeypatch.setattr(messages, "generate", generate)
    with pytest.raises(RuntimeError, match="changed"):
        messages.main(False)
    assert {path: data for path, data in snapshot(package).items() if path in before} == before


def test_check_and_update_hold_one_process_lock_through_publication(package, monkeypatch):
    def assert_locked():
        # A separate process cannot enter the lock during generation or any
        # publication; a normal blocking publisher would wait for its release.
        result = subprocess.run(
            [
                sys.executable,
                "-c",
                """
import fcntl, sys
with open(sys.argv[1], 'a+b') as lock:
    try:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
    except BlockingIOError:
        sys.exit(0)
sys.exit(1)
""",
                str(package.parent / ".cache/messages.lock"),
            ],
            timeout=5,
        )
        assert result.returncode == 0

    monkeypatch.setattr(messages, "generate", lambda staged: assert_locked())
    replace = messages.os.replace

    def publish_locked(source, target):
        assert_locked()
        replace(source, target)

    monkeypatch.setattr(messages.os, "replace", publish_locked)
    assert messages.main(True) == 0
    assert messages.main(False) == 0
    # The persistent lock inode remains, but process ownership is released.
    import fcntl

    with (package.parent / ".cache/messages.lock").open("a+b") as lock:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
