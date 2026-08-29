# GlyphDS (glyph@0.1.0)

This design system is the published glyph React library, bundled as a single
browser global. All 1 components are the real upstream code.

## Where things are

- `_ds_bundle.js` — the whole-DS bundle at the project root; loads every component to `window.GlyphDS`. First line is a `/* @ds-bundle: … */` metadata header.
- `styles.css` + `_ds_bundle.css` — link both. `styles.css` carries tokens and fonts; `_ds_bundle.css` carries component styles.
- `components/<group>/<Name>/<Name>.prompt.md` (example JSX + variants), `<Name>.d.ts` (types), `<Name>.html` (variant grid).
- `tokens/*.css` — CSS custom properties, names verbatim from upstream.
- `fonts/` — `@font-face` files + `fonts.css` (when the package ships fonts).

For a specific component, `read_file("components/<group>/<Name>/<Name>.prompt.md")`.

## Loading

Add these three lines to your page once (React must be on the page first):

```html
<link rel="stylesheet" href="styles.css">
<link rel="stylesheet" href="_ds_bundle.css">
<script src="_ds_bundle.js"></script>
```

Components are then available at `window.GlyphDS.*`. Mount into a dedicated child node (e.g. `<div id="ds-root">`), not the host page's own React root, so the two trees don't collide:

```jsx
const { Badge } = window.GlyphDS;
ReactDOM.createRoot(document.getElementById('ds-root')).render(<Badge />);
```

## Tokens

0 CSS custom properties from glyph. Names are
preserved verbatim from upstream. See `tokens/` for the full list.



## Components

### general
- `Badge`
