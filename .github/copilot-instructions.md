# Copilot Instructions — Excalibur Projects

Purpose: brief, repo-level guidance for the coding assistant. Limit changes to a single file and no more than 200 lines changed per commit, unless the change is explicitly approved by the maintainer.

## Priority Order

1. Avoid breaking runtime behavior
2. Keep edits minimal
3. Match existing conventions
4. Enforce TypeScript strictness if it does not require cross-file changes. If rules conflict, follow the earlier item.

## TypeScript Best Practices

- Prefer explicit types and avoid `any` unless temporary; use `unknown` when appropriate.
- Enable and respect strict compiler options (`strict`, `noImplicitAny`, `strictNullChecks`).
- Use `const`/`let` correctly; prefer `readonly` for immutable fields.
- Add explicit return types for exported functions and public methods.
- Prefer small, focused functions and single-responsibility classes.
- Use named interfaces/types for complex shapes and re-use them across files. Only introduce or extract shared types across files when the change would otherwise duplicate >3 occurrences, and ask a clarifying question before making multi-file type moves.
- Avoid editing compiled or distribution files in `dist/` — change source `src/` files instead.

## Excalibur Awareness

- This project uses Excalibur.js; prefer consulting the official docs first: https://excaliburjs.com/docs/
- When changing engine behavior, check `src/main.ts`, `src/resources.ts`, and scene/actor files (`src/*.ts`).
- Prefer to use methods and properties of the Excalibur built-in classes, such as Actor, when adding code to modify the behavior or state of the Actor.

## Excalibur Source

- https://github.com/excaliburjs/Excalibur — consult the repository for implementation details of the engine itself.

## Testing & Running

- Assume a file-watcher or hot-reload is enabled and the developer will reload the app as needed; do not instruct the user to launch or restart the app unless the change modifies startup scripts or run configuration.

## Editing Guidelines for the Assistant

- Make minimal, well-scoped changes with clear commit messages.
- If a change touches Excalibur integration (loader, engine options, lifecycle hooks), suggest how to verify it (which file to open, which page to refresh, or which test to run).
- If a change touches any of: build configuration, engine initialization (files that include 'engine' or 'main'), third-party package versions, or more than 3 files, ask one clarifying question before making edits.
- If a proposed change affects more than one of: engine lifecycle, resource loading, public API, or build config, ask exactly one focused clarifying question that names the affected file(s) and the decision needed.
- If running linters or tests fails, include the failing output in your response, revert or comment out the offending change if it was speculative, and ask whether to proceed with a fix. Do not submit changes that cause CI to fail.
- If referenced files are missing or imports fail, ask the user for the correct file path or permission to add missing resources before making changes.
- If a fix requires changes to dependencies or build configuration (package.json, tsconfig.json, webpack), do not modify them without explicit approval; instead propose the change and provide the minimal diff and verification steps.
