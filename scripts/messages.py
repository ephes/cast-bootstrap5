"""Update and compile the theme's gettext catalogs.

Usage (from the repository root):
    uv run --extra test python scripts/messages.py          # makemessages + compilemessages
    uv run --extra test python scripts/messages.py --check  # fail if the .po is stale
"""

import os
import subprocess
import sys
from pathlib import Path

import django
from django.conf import settings
from django.core.management import call_command
from django.core.management.commands.makemessages import Command as MakeMessagesCommand

ROOT = Path(__file__).resolve().parents[1]
PACKAGE = ROOT / "cast_bootstrap5"
LOCALES = ["de"]
CATALOGS = [PACKAGE / "locale" / locale / "LC_MESSAGES" / "django.po" for locale in LOCALES]


class MakeMessages(MakeMessagesCommand):
    # Leave new msgids untranslated instead of guessing fuzzy matches from
    # unrelated strings; they fall back to English until translated.
    msgmerge_options = [*MakeMessagesCommand.msgmerge_options, "--no-fuzzy-matching"]


def main(check: bool) -> int:
    settings.configure(USE_I18N=True)
    django.setup()
    os.chdir(PACKAGE)
    call_command(
        MakeMessages(),
        locale=LOCALES,
        domain="django",
        ignore_patterns=["static/*"],
        add_location="file",
        no_obsolete=True,
        verbosity=0,
    )
    call_command("compilemessages", locale=LOCALES, verbosity=0)
    if not check:
        return 0
    # POT-Creation-Date changes on every run; any other difference means the
    # committed catalog no longer matches the templates.
    diff = subprocess.run(
        ["git", "diff", "--exit-code", "-I", '^"POT-Creation-Date: ', "--", *map(str, CATALOGS)],
        cwd=ROOT,
    )
    if diff.returncode:
        print("Translation catalog is stale: run `just messages` and commit the result.", file=sys.stderr)
    return diff.returncode


if __name__ == "__main__":
    sys.exit(main(check="--check" in sys.argv[1:]))
