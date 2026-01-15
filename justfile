# Justfile for cast-bootstrap5 development

default:
    @just --list

# Install JavaScript dependencies
js-install:
    cd javascript && npm install

# Run Vite development server
js-dev:
    cd javascript && npx vite

# Build Vite bundle
js-build:
    cd javascript && npx vite build

# Build and sync bundle into Django static directory
js-build-sync:
    just js-build
    rm -f javascript/dist/manifest.json
    sh -c 'test -f javascript/dist/.vite/manifest.json && mv javascript/dist/.vite/manifest.json javascript/dist/manifest.json || true'
    python -c "from pathlib import Path; p=Path('javascript/dist/manifest.json'); txt=p.read_text() if p.exists() else None; (p.write_text(txt.rstrip('\\n')+'\\n') if txt is not None else None)"
    rm -rf javascript/dist/.vite
    rm -f cast_bootstrap5/static/cast_bootstrap5/vite/*
    cp javascript/dist/* cast_bootstrap5/static/cast_bootstrap5/vite/

# Run tests once
js-test:
    cd javascript && npx vitest run

# Run tests in watch mode
js-test-watch:
    cd javascript && npx vitest watch
