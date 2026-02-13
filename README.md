![Screenshot_20230513_215640_Photo_Editor_Pro_-_Polish](https://github.com/topherchris420/vanta/assets/93827718/616c1cab-be33-4b63-a6fe-c44abc5e31ab)

my portfolio

## Spline UI integration

This repo now includes the Spline demo component set under `components/ui`:

- `components/ui/splite.jsx`
- `components/ui/spline-scene-basic.jsx`
- `components/ui/demo.tsx` (shader animation demo)
- `components/ui/shader-animation.tsx`
- `components/ui/card.jsx`
- `components/ui/spotlight.jsx`

It is exposed at `/spline-demo`.

## Project structure checks

Current defaults in this codebase:

- Components root: `components/`
- Styles root: `styles/` (`styles/globals.css` is the global stylesheet)

`/components/ui` was created because shadcn-style UI components are expected to live in a dedicated, reusable location. Keeping UI primitives in `components/ui` avoids scattering design-system components and keeps imports predictable (`@/components/ui/...`).

## If you want full shadcn + Tailwind + TypeScript setup

The current app is JavaScript/CSS-module based. To fully align it with shadcn defaults, run:

```bash
# 1) install required packages
npm install -D tailwindcss postcss autoprefixer typescript @types/react @types/node

# 2) initialize tailwind
npx tailwindcss init -p

# 3) initialize shadcn
npx shadcn@latest init
```

Recommended shadcn answers for this repo:

- TypeScript: **Yes** (creates `tsconfig.json` + typed config)
- Style: **Tailwind CSS**
- Components directory: **`components`**
- Base color: your choice
- CSS variables: **Yes**

Then set aliases in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

And ensure `styles/globals.css` contains Tailwind directives:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

If your environment allows npm access, you can swap the iframe renderer for `@splinetool/react-spline` later. In restricted environments (403 from registry), the current iframe-based `SplineScene` works without extra packages.

## Shader animation integration

Added the requested shader component files to `components/ui`:

- `components/ui/shader-animation.tsx`
- `components/ui/demo.tsx`

Dependency check:

- `three` is already installed in `package.json`, so no extra install is required for this repo right now.
