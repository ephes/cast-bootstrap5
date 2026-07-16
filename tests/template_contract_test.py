import json
import re
import tomllib
from datetime import UTC, datetime
from pathlib import Path
from types import SimpleNamespace

import cast
from django.conf import settings
from django.template import Context, Engine

if not settings.configured:
    settings.configure(USE_I18N=False, USE_TZ=True)

ROOT = Path(__file__).parents[1]
TEMPLATE_DIR = ROOT / "cast_bootstrap5" / "templates" / "cast" / "bootstrap5"
DJANGO_CAST_TEMPLATE_DIR = Path(cast.__file__).parent / "templates"


def test_django_cast_dependency_includes_shared_metadata_partial_release():
    project = tomllib.loads((ROOT / "pyproject.toml").read_text())

    assert "django-cast>=0.2.62" in project["project"]["dependencies"]


def test_search_modal_progressively_uses_core_suggestion_url():
    template = (TEMPLATE_DIR / "_search_modal.html").read_text()

    assert 'data-cast-search-suggestions-url="{{ page.search_suggestions_api_url }}"' in template
    assert 'role="listbox"' in template
    assert 'data-cast-suggestion-status class="visually-hidden" aria-live="polite"' in template
    assert "data-cast-suggestion-many=\"{% translate '{count} suggestions available.' %}\"" in template


def test_post_delegates_social_metadata_to_django_cast():
    template = (TEMPLATE_DIR / "post.html").read_text()

    assert '{% include "cast/includes/post_social_meta.html" %}' in template
    assert '<link rel="canonical" href="{{ absolute_page_url }}">' in template


def test_audio_episode_reuses_shared_metadata_with_player_contract():
    template = (TEMPLATE_DIR / "episode.html").read_text()

    assert "{% if episode.podcast_audio and social_cover_image_url %}" in template
    assert 'twitter_card="player" structured_data_type="PodcastEpisode"' in template
    assert '<meta name="twitter:player" content="{{ player_url }}">' in template
    assert '<meta name="twitter:player:stream" content="{{ podcast_audio_url }}">' in template
    assert '<meta property="og:audio" content="{{ podcast_audio_url }}">' in template
    assert "{% elif episode.podcast_audio %}" in template


def render_episode_social_block(*, has_audio, cover_url):
    source = (TEMPLATE_DIR / "episode.html").read_text()
    start = source.index("{% block social_meta %}")
    end = source.index("{% endblock social_meta %}") + len("{% endblock social_meta %}")
    template_source = '{% extends "parent.html" %}\n' + source[start:end]
    engine = Engine(
        dirs=[DJANGO_CAST_TEMPLATE_DIR],
        loaders=[
            (
                "django.template.loaders.locmem.Loader",
                {
                    "parent.html": "{% block social_meta %}PARENT METADATA{% endblock social_meta %}",
                    "episode.html": template_source,
                },
            ),
            "django.template.loaders.filesystem.Loader",
        ],
    )
    timestamp = datetime(2026, 7, 9, tzinfo=UTC)
    context = Context(
        {
            "absolute_page_url": "https://example.com/episode/",
            "blog": SimpleNamespace(title="Example", author_name="Author"),
            "cover_alt_text": "Cover",
            "episode": SimpleNamespace(podcast_audio=object() if has_audio else None),
            "page": SimpleNamespace(
                title="Episode title",
                seo_title="",
                search_description="",
                first_published_at=timestamp,
                last_published_at=timestamp,
                visible_date=timestamp,
            ),
            "player_url": "https://example.com/player/",
            "podcast_audio_url": "https://example.com/audio.m4a",
            "social_cover_image_height": 630,
            "social_cover_image_url": cover_url,
            "social_cover_image_width": 1200,
        },
        use_l10n=False,
        use_tz=False,
    )
    return engine.get_template("episode.html").render(context)


def test_rendered_audio_episode_selects_player_only_with_cover():
    covered = render_episode_social_block(has_audio=True, cover_url="https://example.com/cover.jpg")
    coverless = render_episode_social_block(has_audio=True, cover_url="")

    assert '<meta name="twitter:card" content="player">' in covered
    assert '<meta name="twitter:player" content="https://example.com/player/">' in covered
    assert '<meta name="twitter:card" content="summary">' in coverless
    assert '<meta name="twitter:player"' not in coverless
    assert '<meta property="og:audio" content="https://example.com/audio.m4a">' in coverless

    match = re.search(r'<script type="application/ld\+json">\s*(.*?)\s*</script>', coverless, re.DOTALL)
    assert match is not None
    assert json.loads(match.group(1))["@type"] == "PodcastEpisode"


def test_rendered_episode_without_audio_uses_parent_metadata():
    rendered = render_episode_social_block(has_audio=False, cover_url="")

    assert "PARENT METADATA" in rendered
    assert "twitter:player" not in rendered
