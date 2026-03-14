# Core E2E Smoke Test (Critical Path)

Use this skill for a fast, high-signal regression check after code changes.  
Industry-standard term: **smoke test** (also called **critical-path smoke test**).

## Goal

Verify the core video-annotation path still works end-to-end and immediately report any deviation to the reviewer.

## When to use

- Before/after non-trivial UI, playback, comments, or timebar changes.
- Before handing off a PR for review.
- During Cloud-agent validation when confidence is needed quickly.

## Test target selection

Open the version that matches what is being validated:

- **Local change validation:** `http://localhost:3000`
- **Server/deployed validation:** provided staging/preview/production URL

Record in your notes which URL you tested.

## Preconditions

- No app login is required for this flow.
- Test data includes multiple videos.
- Video named **`Nadia 12 mars`** is present.

## Procedure (must run in browser)

1. Open the target application URL.
2. Go to the video listing page.
3. Confirm multiple videos are visible.
4. Open **`Nadia 12 mars`**.
5. Wait for the player to load (expected within a few seconds).
6. Confirm existing comments are visible.
7. Confirm green ranges are visible on the timebar and align with comment time ranges.
8. Validate timebar drag-selection behavior with all cases below:
   - **Left-to-right drag:** selection turns blue while dragging.
   - **Right-to-left drag:** selection turns blue while dragging.
   - During drag, video frame preview/time updates continuously with cursor position.
   - On mouse release, playback position stays at the drag end time.
   - Drag with cursor moving outside timebar vertically, and release outside the timebar.
   - Repeat the outside-vertical drag in both directions (above and below the timebar).

## Pass criteria

- All steps above succeed with expected behavior.
- No console/runtime errors that impact the tested flow.

## Mandatory reporting (notify reviewer)

If anything does not go as planned, notify the reviewer immediately with:

1. Failed step number + short title.
2. Expected vs actual behavior.
3. Impact level:
   - `blocker` (core flow broken),
   - `major` (core flow degraded),
   - `minor` (non-blocking mismatch).
4. Evidence:
   - screenshot/video path,
   - relevant logs/errors.
5. Repro notes:
   - tested URL,
   - browser,
   - exact interaction sequence.

Use this one-line prefix in the report:  
`SMOKE TEST ALERT: <blocker|major|minor> - <failed step>`

## Suggested concise result format

- `Target:` `<url>`
- `Result:` `PASS` or `FAIL`
- `Checked:` `videos list`, `Nadia 12 mars load`, `comments`, `green ranges`, `drag cases`
- `Notes:` key observations or alert payload
