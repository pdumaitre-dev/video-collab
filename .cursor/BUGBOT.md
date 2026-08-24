# Studio — no silent failures

If a changed file contains an empty `catch`, a `catch` that only `console.error`s then continues, or any swallow of an error without a user-visible or HTTP error, then:

- Add a blocking finding titled `[Studio] Silent failure`
- Body: "Re-throw, return `{ error }`, or add a comment that the swallow is intentional."

- Blob listing UI must not collapse listing failures into an empty "No videos found" state.
