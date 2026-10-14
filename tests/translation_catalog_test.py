import ast
import gettext
from pathlib import Path

LOCALE_DIR = Path(__file__).parents[1] / "cast_bootstrap5" / "locale"
GERMAN = LOCALE_DIR / "de" / "LC_MESSAGES"


def read_po_translations(path):
    """Return {msgid: msgstr} for translated, non-fuzzy singular entries."""
    entries, current, field, fuzzy = {}, {}, None, False

    def flush():
        msgid, msgstr = current.get("msgid"), current.get("msgstr")
        if msgid and msgstr and not fuzzy:
            entries[msgid] = msgstr

    for line in path.read_text(encoding="utf-8").splitlines() + [""]:
        if not line.strip():
            flush()
            current, field, fuzzy = {}, None, False
        elif line.startswith("#,"):
            fuzzy = fuzzy or "fuzzy" in line
        elif line.startswith("#"):
            continue
        elif line.startswith('"'):
            current[field] += ast.literal_eval(line)
        else:
            field, value = line.split(" ", 1)
            assert field in ("msgid", "msgstr"), f"unsupported .po field {field!r}"
            current[field] = ast.literal_eval(value)
    return entries


def test_german_catalog_is_compiled_from_current_po():
    po = read_po_translations(GERMAN / "django.po")
    with (GERMAN / "django.mo").open("rb") as fp:
        compiled = gettext.GNUTranslations(fp)

    catalog = {key: value for key, value in compiled._catalog.items() if key}
    assert po
    assert catalog == po, "django.mo is stale: run `just messages` and commit the result"


def test_german_catalog_translates_theme_strings():
    german = gettext.translation("django", localedir=LOCALE_DIR, languages=["de"])

    assert german.gettext("Skip to content") == "Zum Inhalt springen"
    assert german.gettext("Transcript: %(title)s") == "Transkript: %(title)s"
