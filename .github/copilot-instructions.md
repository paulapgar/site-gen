# Copilot Instructions — Excalibur Projects

## Priority Order (resolve conflicts in this order)

1. Avoid breaking runtime behavior
2. Keep edits minimal and well-scoped
3. Match existing conventions
4. Enforce TypeScript strictness only if it does not require cross-file changes

## TypeScript Best Practices

- Prefer explicit types; avoid `any` unless temporary, use `unknown` when appropriate.
- Respect strict compiler options (`strict`, `noImplicitAny`, `strictNullChecks`).
- Use `const`/`let` correctly; prefer `readonly` for immutable fields.
- Add explicit return types for exported functions and public methods.
- Prefer small, focused functions and single-responsibility classes.
- Use named interfaces/types for complex shapes and reuse them across files. Only extract shared types when the change would otherwise duplicate >3 occurrences — ask before making multi-file type moves.
- Never edit compiled or distribution files in `dist/` — change source `src/` files instead.

## Excalibur.js Guidelines

- This project uses [Excalibur.js](https://excaliburjs.com/docs/). Consult the official docs first for API questions.
- When changing engine behavior, check `src/main.ts`, `src/resources.ts`, and scene/actor files (`src/*.ts`).
- Prefer using methods and properties of Excalibur built-in classes (e.g., `Actor`) over workarounds when modifying actor behavior or state.
- For implementation details of the engine itself, consult the source: https://github.com/excaliburjs/Excalibur
- Reference patterns are available in `/memories/repo/excalibur-patterns.md` for common boilerplate (actor lifecycle, collision handling, actions).

## Testing & Running

- Assume a file-watcher or hot-reload is enabled; do not instruct the user to launch or restart the app unless the change modifies startup scripts or run configuration.

## Documentation Folder (`/docs`)

- The `/docs` folder contains research and planning documents only.
- Do not edit files in `/docs` unless updating or creating documentation.
- It is not part of the runtime codebase — never reference it from source files.

## Editing Guidelines

- Make minimal, well-scoped changes with clear commit messages (≤200 lines changed per commit).
- If a change touches Excalibur integration (loader, engine options, lifecycle hooks), suggest how to verify it (which file to open or page to refresh).
- **Ask one clarifying question before editing** if the change touches any of: build configuration (`vite.config.*`, `tsconfig.json`), engine initialization files (`main.ts`, files containing "engine"), third-party package versions, or more than 3 files.
- If a proposed change affects multiple sensitive areas (engine lifecycle, resource loading, public API, build config), ask exactly one focused question naming the affected file(s) and the decision needed.
- If linters or tests fail, include the failing output in your response, revert or comment out the offending speculative change, and ask whether to proceed with a fix. Do not submit changes that cause CI to fail.
- If referenced files are missing or imports fail, ask for the correct path or permission to add resources before making changes.
- For dependency or build config changes (`package.json`, `tsconfig.json`), do not modify them without explicit approval — propose the change with a minimal diff and verification steps instead.
