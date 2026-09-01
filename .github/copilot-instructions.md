# Response Style

Caveman response mode. Terse, technical prose. Drop greetings, filler, repeated summaries, hedging. Fragments fine. Preserve code, commands, paths, URLs, identifiers, diffs, tables, errors exactly. Explain only non-obvious decisions, risks, or required user actions. Use normal clarity for security warnings, destructive operations, ambiguity, user-facing documentation.

# Coding Conventions

## General

- Always use arrow functions for components, hooks, and helpers. Never use `function` declarations.
- One component per file. If a file has multiple components, split them into separate files.
- Use descriptive variable names. Never use short names like `prev`, `m`, `d`, `v`, `o`, `e`. Use `currentMembers`, `member`, `item`, `option`, `event` etc.
- Destructure objects when reading multiple properties. Prefer `const { message, type } = form.getValues()` over repeated `values.message`, `values.type`. Use the plain property name so shorthand works when re-emitting (`{ message, type }`). Only alias (`{ message: messageValue }`) when there is a real name collision with another local in the same scope — do not alias by default.
- Do not destructure in a parent just to re-pass the same fields to a child. If a child's props closely mirror a source object, have the child accept the whole object (or a subset type) as a single prop and destructure inside. Avoids IIFEs and repetitive `foo.x` / `foo.y` prop wiring at the callsite.
- Destructure props directly in the parameter list, not in the function body. If a prop is an object and you only need its inner fields, use nested destructuring in the signature (`({ user: { name, email } }: Props) => ...`) rather than binding the whole prop and re-destructuring inside.
- Prefix event handler callbacks with `on` (e.g. `onConfirmSave`, `onDeleteMember`). Never use `handle` prefix.
- Never use `as` type assertions/casting. If a type mismatch exists, fix the type at the source or use non-null assertion `!` only when the runtime guarantees the value exists.
- Use `{condition && (...)}` / `{!condition && (...)}` pattern instead of ternary `condition ? (...) : (...)` for conditional rendering in JSX.
- Prefer `.filter(...).map(...)` over `.flatMap(...)` when transforming with conditional exclusion. Reads clearer, keeps intent (filter then transform) explicit.

## React Context

- Use `createContext<T | undefined>(undefined)` pattern for context creation.
- Add a guard in the hook: throw an error if context is undefined.
- Inline all state logic directly in the provider component. Do not create separate `useXState` hooks just to extract into context.
- Extract pure utility functions (builders, filters, validators) into a `utils.ts` file to keep the context provider lean.
- Context should hold all shared state so child components can read from it directly — avoid prop drilling.
- Components that trigger dialogs should own those dialogs (e.g. a toolbar owns its own add/save/discard dialogs, not the parent page).

## Components

- Keep components focused. A toolbar component should own its buttons AND the dialogs those buttons trigger.
- Props should only be passed when the data/callback genuinely comes from a parent that owns it. If a value is already accessible from context, read it from context instead of passing it down — and don't thread a prop through an intermediate component when the actual consumer can read it from context directly. The one legitimate pass-down is seeding a provider with state that is owned above it (e.g. a parent owns full-screen state to control page chrome and passes it into a child provider, whose descendants then read it from context).
- Do not repeat the feature/folder name as a prefix on components used only inside that folder. Only the component consumed from outside the folder carries the full feature-prefixed name; internal components (and their supporting context/hooks) use short, unprefixed names.
- Do not self-suppress a component with an early `return null` based on a condition the parent owns. Let the parent decide whether to render it via `{condition && <Component />}`. A component should render its own UI, not opt out of existing.
- `disabled` means disabled, not hidden. Use the `disabled` prop to make a control non-interactive; use conditional rendering in the parent to omit it entirely. Never conflate the two.
- A control repeated across multiple pages/views (e.g. a floating action button) is one shared component, not a copy per page. Its markup, placement, and styling live in that one file; pages only pass in what's genuinely page-specific (a click handler, a disabled flag). A style or position change should require editing exactly one file.

## Routing

- Route files should have data loaders that pre-fetch required data (e.g. via a query client's `ensureQueryData`).
- Create a separate `*.queries.ts` file for query definitions (using `queryOptions` from `@tanstack/react-query`).

## Imports

- Import from specific module paths rather than barrel files in files prone to circular dependencies (e.g. route files importing from a shared router module).
- Group imports: external libs → shared packages → absolute source paths → relative paths.

## Dialogs

- Dialog open/close state should live in the component that triggers the dialog.

## MUI

- Never nest an interactive element (`IconButton`, `Button`, etc.) directly inside `AccordionSummary` — it renders as a `<button>` itself, and a `<button>` inside a `<button>` is invalid HTML that crashes on expand, not just a lint warning. Give the inner element `component="span"`.

## Lint Rules

- `@typescript-eslint/consistent-type-assertions`: Never use `{} as Type`. Use `undefined` with a type guard or provide a real default value.

## Comments

- Do not add comments (line, block, JSDoc, or JSX) unless the user explicitly asks for them. Let names and structure carry the intent. Preserve existing functional comments such as `eslint-disable`, `@ts-expect-error`, and codegen directives.
- When a comment is warranted, keep it to one short line above the thing it describes — a caveman-style label, not a paragraph explaining the reasoning, the history, or the alternatives considered. If it takes more than one line to say, either the code needs a better name instead, or it doesn't belong as an inline comment.
