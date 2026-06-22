---
name: pdds-bug-triage
description: Reproduces PDDS Jira bugs in a cloud agent, records screen evidence, and comments triage results on Jira. Embeds repro video in the agent run only (never uploads to Jira). Use when triaging a PDDS bug (e.g. PDDS-6), reproducing a reported issue, or confirming Video MVP bug reports.
---

# PDDS Bug Triage

PDDS bug → reproduce → screen recording → Jira comment. **Triage does not fix code or investigate root cause** unless the user asks.

## Workflow

```
- [ ] 1. Fetch ticket (Jira MCP)
- [ ] 2. Bootstrap app (cloud)
- [ ] 3. Reproduce + record
- [ ] 4. Comment Jira + show video in this run
```

## Step 1: Fetch ticket

**Project:** [PDDS](https://fe-anysphere-demo.atlassian.net/jira/software/projects/PDDS/)  
**Cloud ID:** `564eb250-21c1-45d7-81f9-527d6bf705ad`

Read MCP schemas, then `getJiraIssue` (`fields: ["*all"]`, `expand: "renderedFields"`, markdown). Extract repro steps, expected/actual, environment, and priority.

## Step 2: Bootstrap app (cloud)

Follow `AGENTS.md` → **Cursor Cloud bootstrap** (Node 24, `npm install`, env, `npm run dev` → `http://localhost:3000`). Prefer fixture **`Nadia 12 mars`**; note substitute if missing.

## Step 3: Reproduce + record

1. Reproduce per ticket steps in the browser (`computerUse` or `cursor-ide-browser`).
2. Record a single repro clip to `/opt/cursor/artifacts/{KEY-lowercase}-repro.mp4` (ffmpeg x11grab + `computerUse` demo, ~15–25s). Re-record if the bug is not visible.
3. Optionally validate with `videoReview` subagent before publishing.

## Step 4: Comment Jira + show video in this run

### Video policy

Do not attempt to post the video to jira. Show it in the cloud agent run. Link to the cloud agent run to let users find the video. Do not create a deeplink to local video.

- **In this run:** embed the recording in the final response:
  ```html
  <video src="/opt/cursor/artifacts/pdds-6-repro.mp4"></video>
  ```
- **In Jira (`addCommentToJiraIssue`):** text findings only + link to **this cloud agent run** (`https://cursor.com/agents/...`). Never attach/upload video, never put `/opt/cursor/artifacts/...`, `file://`, or `localhost` video paths in Jira.

### Jira comment template

```markdown
## Triage — {KEY}

**Result:** Confirmed | Not reproduced | Partially reproduced

**Tested:** `http://localhost:3000` — {video title / path}

**Expected vs actual:** {brief}

**Repro video:** [Cloud Agent run]({this-run-url})
```
