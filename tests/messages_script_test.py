"""Catalog generation never uses translator-owned files as scratch space."""

import importlib.util
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


def test_real_gettext_stages_translations_and_detects_mo_drift(package):
    import gettext
    import shutil

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


def test_new_template_during_generation_refuses_stale_output(package, monkeypatch):
    before = snapshot(package)

    def generate(staged):
        (package / "templates/new.html").write_text("{% translate 'Concurrent string' %}")

    monkeypatch.setattr(messages, "generate", generate)
    with pytest.raises(RuntimeError, match="changed"):
        messages.main(False)
    assert {path: data for path, data in snapshot(package).items() if path in before} == before


def test_check_and_update_hold_one_process_lock_through_publication(package, monkeypatch):
    import subprocess
    import sys

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
