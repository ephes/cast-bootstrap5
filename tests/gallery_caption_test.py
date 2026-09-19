from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch
from urllib.parse import parse_qs, urlsplit

import pytest
from bs4 import BeautifulSoup
from django.conf import settings
from django.template import Context, Engine

if not settings.configured:
    settings.configure(USE_I18N=False, USE_TZ=True)

TEMPLATES = Path(__file__).parents[1] / "cast_bootstrap5" / "templates"


def render_gallery(template_name, *, captions=None, string_if_invalid=""):
    image_pks = [7, 3, 7] if captions is not None and len(captions) == 3 else [7, 7]
    rendition = {"src": {"jpeg": "/full.jpg"}, "srcset": {}, "width": 200, "height": 100}
    image = SimpleNamespace(pk=7, default_alt_text="Alt text", modal=rendition, thumbnail=rendition)
    other = SimpleNamespace(pk=3, default_alt_text="Other image", modal=rendition, thumbnail=rendition)
    images = [image if pk == 7 else other for pk in image_pks]
    context = {"images": images, "block": {"id": "example"}, "image_pks": ",".join(map(str, image_pks))}
    if captions is not None:
        context["gallery_entries"] = [{"image": current, "caption": caption} for current, caption in zip(images, captions)]
    image.caption = "Global caption must not leak"
    image.image = "Global image attribute must not replace the legacy image"
    engine = Engine(dirs=[TEMPLATES], string_if_invalid=string_if_invalid)
    with patch("django.urls.reverse", return_value="/gallery/modal/"):
        rendered = engine.get_template(f"cast/bootstrap5/{template_name}").render(Context(context))
    assert image.caption == "Global caption must not leak"
    return BeautifulSoup(rendered, "html.parser")


@pytest.mark.parametrize("template_name", ["gallery.html", "gallery_htmx.html"])
@pytest.mark.parametrize("captions", [None, ["", ""]])
@pytest.mark.parametrize("string_if_invalid", ["", "INVALID"])
def test_legacy_and_empty_captions_preserve_gallery_links(template_name, captions, string_if_invalid):
    soup = render_gallery(template_name, captions=captions, string_if_invalid=string_if_invalid)
    links = soup.select(".cast-gallery-container > a.cast-image-gallery-thumbnail")
    assert len(links) == 2
    assert all(link["href"] == "/full.jpg" for link in links)
    assert not soup.select("figure, figcaption")
    assert links[0].img["data-next"] == "img-example-1"
    assert links[1].img["data-prev"] == "img-example-0"
    assert links[1].img["data-next"] == "false"
    if template_name == "gallery_htmx.html":
        assert "current_image_index=1" in links[1]["data-hx-get"]


@pytest.mark.parametrize("template_name", ["gallery.html", "gallery_htmx.html"])
def test_duplicate_image_has_distinct_escaped_captions(template_name):
    captions = ['First <script>alert("x")</script>', "Second & different"]
    soup = render_gallery(template_name, captions=captions)
    links = soup.select(".cast-gallery-container > a.cast-image-gallery-thumbnail")
    assert [link.figcaption.get_text() for link in links] == captions
    assert all(link.figure.picture.img for link in links)
    assert all(link["aria-describedby"] == link.figcaption["id"] for link in links)
    assert not soup.select("script")
    assert links[0].img["id"] == "img-example-0"
    assert links[1].img["id"] == "img-example-1"
    assert links[0].img["src"] == links[1].img["src"]


def test_htmx_indices_select_matching_image_pks_including_duplicates():
    soup = render_gallery("gallery_htmx.html", captions=["First image", "Different image", "First reused"])
    for index, link in enumerate(soup.select(".cast-gallery-container > a")):
        query = parse_qs(urlsplit(link["data-hx-get"]).query)
        ids = query["image_pks"][0].split(",")
        assert ids == ["7", "3", "7"]
        assert int(query["current_image_index"][0]) == index
        selected_pk = int(ids[int(query["current_image_index"][0])])
        assert link.img["alt"] == ("Other image" if selected_pk == 3 else "Alt text")
