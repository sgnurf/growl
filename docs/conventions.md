# Growl — Coding Conventions

This document records the conventions agreed upon for the Growl codebase. The goal is consistency and readability for anyone coming to the code fresh.

---

## Naming

### No non-standard abbreviations

Use full, descriptive names for variables, functions, parameters, and files. Abbreviating to save keystrokes makes code harder to read for someone unfamiliar with the codebase.

**Allowed:** universally understood abbreviations such as `id`, `url`, `min`, `max`, `i` / `j` in loops, and single-letter parameters in short inline lambdas where the type is obvious from context.

```ts
// ✅ Allowed — single-letter lambda param, type is clear from context
data.some((p: { name: string }) => p.name === 'Growl')

// ✅ Allowed — universally understood
const projectId = project.id;
const apiUrl = '/api/v1/projects';
```

**Not allowed:** domain-specific abbreviations that require familiarity with the codebase to decode.

```ts
// ❌ Avoid — what is rt? What is et?
const rtBase = `/api/v1/projects/${projectId}/relationship-types`;
const etId = entityType.id;

// ✅ Prefer
const relationshipTypesUrl = `/api/v1/projects/${projectId}/relationship-types`;
const entityTypeId = entityType.id;
```

This rule applies everywhere: source code, tests, and scripts.

---

## TypeScript

- Prefer `interface` over `type` for object shapes that represent domain concepts.
- Use `type` for unions, aliases, and utility types (e.g. `type FieldType = 'string' | 'int' | ...`).
- Do not use `any` except as a last resort and with a comment explaining why.

---

## Comments

Write no comments by default. Only add a comment when the **why** is non-obvious — a hidden constraint, a subtle invariant, a workaround for a specific bug. If removing the comment would not confuse a future reader, do not write it.

Do not comment what the code does. Well-named identifiers already do that.

---

## API responses

All `/api/v1/` endpoints return a `{ data, error }` envelope (see `src/lib/api/types.ts`):

- Success: `{ data: T, error: null }` with an appropriate 2xx status.
- Failure: `{ data: null, error: { message, code? } }` with an appropriate 4xx/5xx status.

Do not mix this envelope with plain responses in the same route group.
