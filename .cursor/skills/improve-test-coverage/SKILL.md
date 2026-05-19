---
name: improve-test-coverage
description: >-
  Demo: minimal steps to add tests where coverage is weak. Use when asked to
  improve test coverage or add missing tests.
---

# Improve test coverage (demo)

1. Pick one module or route with no/few tests.
2. Add one test file next to it (or under `__tests__/`) that asserts the main happy path.
3. Run the project’s test or lint script from `package.json` and fix failures.

Keep the diff small: one behavior, one test file.
