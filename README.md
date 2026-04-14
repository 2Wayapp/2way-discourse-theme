# 2Way Web App Theme

This is the starter Discourse theme for the 2Way community forum.

The source of truth is the web app, not the WordPress site:

- `/Users/evilone/Documents/Development/2Way/code/Web-App/src/theme/tokens.css`
- `/Users/evilone/Documents/Development/2Way/code/Web-App/src/theme/semantic.css`
- `/Users/evilone/Documents/Development/2Way/code/Web-App/src/theme/components.css`
- `/Users/evilone/Documents/Development/2Way/code/Web-App/src/components/app-shell.tsx`
- `/Users/evilone/Documents/Development/2Way/code/Web-App/src/components/app-shell-header.tsx`
- `/Users/evilone/Documents/Development/2Way/code/Web-App/src/components/app-shell-sidebar-nav.tsx`
- `/Users/evilone/Documents/Development/2Way/code/Web-App/src/lib/navigation/read.ts`

## What this starter locks in

- `Inter` as the forum UI font to match the web app shell
- the web app shell palette:
  - app background: `#f6f7f8`
  - surface: `#ffffff`
  - desktop sidebar: `#335c81`
  - sidebar header: `#2d5070`
  - primary action: `#3d6f91`
  - primary link/focus accent: `#1978e5`
- the rounded card/button feel from the app
- Discourse sidebar styling so the forum reads like the same product family

## Critical parity requirement

The web app owns the primary application navigation. The forum theme should feel like one surface within that same product.

The highest-risk parity break is the `Forms` entry. In the web app, the visible label comes from backend navigation data and is currently backed by the `survey` module mapping. That means:

- if the app shows `Forms`, the forum should also expose `Forms`
- the icon treatment should follow the web app nav icon style
- the click target should go to the real forms route in the app, not a fake Discourse page

This starter includes theme settings for:

- `webapp_url`
- `forms_url`
- `forms_label`
- `forms_icon_url`

Those settings are intentionally present before the header component is wired, so the next slice can add a dedicated brand/header component without changing the theme contract.

## Recommended Discourse structure

Keep the forum implementation split into:

1. `2way-webapp-theme`
   - full theme
   - owns typography, surfaces, buttons, cards, sidebar chrome, general layout feel

2. `2way-brand-links`
   - theme component
   - owns product-aware links like `Forms`, `Community`, and a return path back into the app

3. optional section-specific components
   - homepage hero
   - association-specific header copy
   - legal/footer extras

This keeps the core theme stable and prevents the `Forms` link behavior from being buried inside broad CSS changes.

## Install on the forum

Discourse server facts already verified:

- host: your 2Way Discourse host
- SSH user: `twadmin`
- Discourse root: `/var/discourse`
- container config: `/var/discourse/containers/app.yml`
- running container: `app`

Normal theme workflow should use the Discourse admin UI, not direct container edits.

### Admin install

1. Put this theme in its own git repo.
2. In Discourse admin go to `Appearance -> Themes and components`.
3. Choose `Install -> From a git repository`.
4. Paste the repo URL for the theme repository you want Discourse to track.
5. If the repo is private, add the generated deploy key to the repo and retry.
6. Preview the theme first, then set it as the default once parity is acceptable.

### Server inspection only

Use these commands only for inspection and rebuilds, not for theme authoring:

```bash
ssh twadmin@forum.2way.is
cd /var/discourse
docker ps
./launcher enter app
```

Rebuild is only needed for container-level changes, not normal remote theme updates:

```bash
cd /var/discourse
./launcher rebuild app
```

## Next implementation slice

The next safe slice should be:

1. install this starter as a remote theme
2. verify color, font, card, and sidebar parity
3. add a small companion theme component for:
   - `Forms`
   - app return link
   - app-aligned nav icon treatment

That keeps the `Forms` behavior explicit and easy to test.
