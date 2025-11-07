# Repository Guidelines

## Project Structure & Module Organization
- `src/ui` holds the Vite entry (`main.ts`) and DOM components; reusable detection, PDF/image, file-access, and PWA helpers live in `src/lib/<domain>`.
- Styles stay in `src/styles` and `styles.css`, static assets in `public/`, long-form docs in `docs/`, builds in `dist/`, and all tests under `tests/` (`unit/*.test.ts`, `e2e.spec.ts`).

## Build, Test & Development Commands
- `npm run dev` starts the Vite server with HMR at `localhost:5173`.
- `npm run build` compiles the app and re-generates the Workbox service worker; verify the output in `dist/`.
- `npm run preview` serves the production bundle locally.
- `npm test`, `npm run test:ui`, and `npm run test:coverage` run Vitest in CLI, inspector, or coverage mode; run the coverage job before requesting review.

## Coding Style & Naming Conventions
- Strict TypeScript settings prohibit implicit `any`; export typed helpers from `src/lib`, prefer `const`, and isolate side effects at the UI boundary.
- Use 2-space indentation, PascalCase filenames for UI classes, camelCase symbols for functions/instances, and dashed CSS class names (`drop-zone`, `glass-card`). Complex transitions belong in `src/styles`.
- Keep DOM components declarative: build elements, wire listeners, and offload OCR/detection work to lib modules so it can be unit-tested.

## Testing Guidelines
- Colocate unit specs in `tests/unit/<feature>.test.ts` and reserve `<area>.spec.ts` for flows that cross modules (PDF pipeline, dropzone → export).
- Keep branch coverage high for `src/lib/detect/**`; treat regressions as release blockers.
- DOM-heavy cases run under jsdom—scope fixtures to the spec or a helper and avoid mutable globals so suites stay parallel-safe.

## Commit & Pull Request Guidelines
- Match the current history: short, imperative commits (`Fix PDF viewer scrolling issue`) and reference issue IDs or PR numbers inline when relevant.
- Pull requests should summarize the privacy or UX problem, list validation commands, attach screenshots/video for UI edits, and call out any service-worker or cache changes.
- Keep feature branches rebased, run the full test suite before pushing, and flag security-impacting changes in the PR description for focused review.

## Security & Configuration Tips
- Processing must remain client-side; adding telemetry, uploads, or third-party SDKs requires a privacy review and opt-in flag.
- When bumping dependencies, confirm `npm run preview` works offline and that the Workbox manifest regenerates to avoid stale caches.
- Treat sample documents as sensitive material: keep scrubbed fixtures in `docs/` or `tests/fixtures`, and never commit real PII.
