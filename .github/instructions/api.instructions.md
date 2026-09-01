---
applyTo: "api/**"
---

# API Coding Conventions

## Socket Handlers

- `create*` handlers historically destructure only specific fields off `received` (e.g. `const { dogs, description, position } = received`) before building the document, while `update*` handlers spread the whole payload (`{ ...received }`) into `findOneAndUpdate`. Adding a new field to an entity and only wiring it into the form/type layer silently drops it on create — the field never reaches `Model.create(...)` unless it's added to the destructure too. Check every `create*` handler's destructure when adding a field, not just the corresponding `update*` handler.
- This asymmetry exists because `findOneAndUpdate(filter, { ...received }, ...)` is safe to spread — Mongoose treats a plain object update as an implicit `$set`, so fields absent from `received` are left untouched rather than wiped. `create*` has no such safety net: whatever isn't explicitly destructured never exists on the new document.
