# hackweek_h2

Client-side rendered React app built with Vite, TypeScript, [Chakra UI v3](https://chakra-ui.com) and CSS Modules.

## Getting started

```bash
pnpm install
pnpm dev       # start dev server at http://localhost:5173
pnpm build     # type-check and build to dist/
pnpm preview   # serve the production build
pnpm lint      # run oxlint
```

## Conventions

- **Components**: use Chakra UI (`@chakra-ui/react`). Generated Chakra snippets live in `src/components/ui` (add more with `pnpm --allow-build=esbuild dlx @chakra-ui/cli snippet add <name>`).
- **Styles**: co-locate CSS Modules as `Component.module.css` and import them as `styles`.
- **Imports**: `@/` resolves to `src/`.
