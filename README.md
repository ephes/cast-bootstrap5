# Installing Bootstrap5 Theme for Django-Cast

This document provides the instructions on how to install the Bootstrap5 theme for Django-Cast. Please follow the steps below.

## Installation

### 1. Install the theme

To install the Bootstrap5 theme, you will need to run the following command in your command line:

```shell
pip install cast-bootstrap5
```

### 2. Add to INSTALLED_APPS and set CRISPY_TEMPLATE_PACK

You will need to add `crispy_bootstrap5` and `cast_bootstrap5.apps.CastBootstrap5Config`
to your INSTALLED_APPS in your Django settings. Also, if `crispy_forms` is not
yet added, add it to INSTALLED_APPS.

Then, set the CRISPY_TEMPLATE_PACK and CRISPY_ALLOWED_TEMPLATE_PACKS like so:

```python
INSTALLED_APPS = [
    ...,
    'crispy_forms',
    'crispy_bootstrap5',
    'cast_bootstrap5.apps.CastBootstrap5Config',
    ...
]

CRISPY_TEMPLATE_PACK = "bootstrap5"
CRISPY_ALLOWED_TEMPLATE_PACKS = "bootstrap5"
```
### 3. Set the theme in Wagtail admin

You can set the theme to `bootstrap5` in the Wagtail admin for the
complete site or just one blog.

### End

That's it! You have successfully installed and set up the Bootstrap5 theme
for [`django-cast`](https://github.com/ephes/django-cast).

## Development
### Install javascript dependencies

All javascript stuff lives in the `javascript` folder. So the first thing
to do is to change to that folder.
```shell
cd javascript
```

Then install the dependencies:

```shell
npm install
```

### Build javascript

```shell
npx vite build
```

After that you have to copy the contents of the `dist` folder
to the `cast_bootstrap5/static/cast_bootstrap5/vite` folder. Including
the manifest file from `dist/.vite/manifest.json`.

```shell
cp dist/main* ../cast_bootstrap5/static/cast_bootstrap5/vite
cp dist/.vite/manifest.json ../cast_bootstrap5/static/cast_bootstrap5/vite
```

### Run tests

```shell
npx vitest run  # run tests once
npx vitest watch  # run tests on file changes
```

### Run development server

```shell
npx vite
```
