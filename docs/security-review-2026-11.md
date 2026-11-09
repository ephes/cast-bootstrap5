# Sicherheitsprüfung November 2026

Stand: 09.11.2026, Ausgangsstand `a7473c1`, Slice `cast-themes-audit`.
Geprüft: eigene Python-Dateien, Django-Templates, JavaScript-Quellen und
mitgelieferte statische Skripte; vollständiges npm-Lockfile inklusive Entwicklung.
Keine Prüfung der produktiven Sites oder vollständige Prüfung von django-cast.

| Befund / Stelle | Schwere | Bewertung / Fix |
| --- | --- | --- |
| `styleguide/sections.html:386`: `gallery_html|safe` | Hinweis | Bewusste HTML-Vertrauensgrenze. Der Core liefert gerenderte Galerieblöcke (`styleguide_gallery_blocks`), keine unmittelbaren Request-Werte. Kein belegter XSS-Pfad im Theme. Nur serverseitig gerendertes HTML übergeben; bei Änderungen am Core Datenfluss erneut prüfen. |
| `styleguide/sections.html:374,380,394,411,416`: dynamische Includes aus `template_base_dir` | Hinweis | Theme-Auswahl gehört django-cast; die geprüfte Core-Version 0.2.68 prüft den Query-Override gegen registrierte Themes. Kein lokaler Dateileser und kein belegter Traversal-Pfad im Theme. Custom-Themes aus Settings bleiben Betreiberkonfiguration. |
| `blog_list_of_posts.html:26`, `post_body.html:41`: Richtext / StreamField | Hinweis | Wagtail-Rendering ist eine Vertrauensgrenze, keine Auswertung von Editor-Text als Django-Template. Raw-HTML-Blöcke und eigene Core-Blocktemplates benötigen vertrauenswürdige Redaktion bzw. zentrale Sanitizer-Policy; das ist ein größeres Core-/Site-Thema. |
| `javascript/package-lock.json` | Kein Befund | `npm audit --package-lock-only --json`: 0 Advisories am Prüftag, einschließlich Dev-Abhängigkeiten. Keine Änderung erforderlich. |

Stellen ohne vollständigen Pfad liegen unter `cast_bootstrap5/templates/cast/bootstrap5/`.
Kein `mark_safe` oder `autoescape off` im Theme. Galerie-`innerHTML` setzt nur
konstante Buttons; Podlove setzt konstantes Lade-Markup bzw. stellt zuvor
vorhandenes Button-Markup wieder her. Titel, Captions, Transkripte und
HTML-Attribute bleiben im normalen Django-Escaping. Fremde Core-/Site-Templates,
CDN-/Player-Code und manuell eingebundene Vendor-Dateien sind nicht durch das
npm-Lockfile-Audit abgedeckt; keine pauschale Sicherheitsfreigabe dafür.

Validierung (Node 24): npm-Audit 0 Advisories, strikte TypeScript-Prüfung,
Vitest (383 Tests), native Chromium-Tests (3 Tests, Playwright), pytest
(26 Tests), Asset-Neubau ohne Drift und Katalogprüfung erfolgreich.
Dieser Slice dokumentiert die Prüfung; keine Verhaltensänderung.
