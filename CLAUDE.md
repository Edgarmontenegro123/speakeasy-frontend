# Speakeasy Frontend — Development Guidelines

## Commands
- Dev: `npm run dev`
- Build: `npm run build`
- Lint: `npm run lint`
- Preview production build: `npm run preview`
- Test: `npm run test`

## Code Style Guidelines
- **JS/TS Syntax:** Single quotes `'`, NO semicolons `;`, compact imports `{useState, useEffect}`.
- **Architecture:** React (Vite) + TypeScript + Tailwind CSS, with custom hooks under `src/hooks`.
- **Testing:** Vitest + React Testing Library, jsdom environment, setup file at `src/setupTests.ts`.
- **Git Commits:** Emoji + British English description (e.g. `🐛 Fix audio state machine transition`).

## Related Repositories
- Backend: [speakeasy-backend](https://github.com/Edgarmontenegro123/speakeasy-backend)
