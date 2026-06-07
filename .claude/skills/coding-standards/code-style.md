# Code Style

## Comments

**Do not** add comments explaining what code does — well-named identifiers do that.
**Do** add a comment when the _why_ is non-obvious: a hidden constraint, a subtle invariant, a workaround for a specific bug, or behavior that would surprise a reader.

If removing the comment wouldn't confuse a future reader, don't write it.

## General Principles

- Prefer editing existing files to creating new ones
- Don't add features, refactor, or introduce abstractions beyond what the task requires
- Three similar lines is better than a premature abstraction
- Don't design for hypothetical future requirements
- No half-finished implementations
- Don't add error handling or validation for scenarios that can't happen — trust internal code and framework guarantees
- Only validate at system boundaries (user input, external APIs)
- Don't use feature flags or backwards-compatibility shims when you can just change the code
- Avoid backwards-compatibility hacks (renaming unused `_vars`, re-exporting removed types, `// removed` comments for deleted code)
- Avoid nested ternary operators — prefer `switch` statements or `if/else` chains
- Choose clarity over brevity — explicit code is often better than overly compact code
- When you have a function with more than one parameter with the same type, use an object parameter instead of positional parameters:

```ts
// BAD
const addUserToTrip = (userId: string, tripId: string) => {}

// GOOD
const addUserToTrip = ({ userId, tripId }: { userId: string; tripId: string }) => {}
```
