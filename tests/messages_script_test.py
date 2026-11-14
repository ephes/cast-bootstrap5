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
