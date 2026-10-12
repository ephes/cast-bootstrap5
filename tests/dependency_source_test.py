"""Keep the temporary uv source compatible with sites tracking django-cast develop."""

import tomllib
from pathlib import Path

ROOT = Path(__file__).parents[1]


def test_django_cast_source_matches_develop_consumers():
    project = tomllib.loads((ROOT / "pyproject.toml").read_text())

    assert project["tool"]["uv"]["sources"]["django-cast"] == {
        "git": "https://github.com/ephes/django-cast",
        "branch": "develop",
    }
