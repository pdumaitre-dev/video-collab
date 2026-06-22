---
name: ticket-to-prd
description: Converts a PDDS Jira ticket into a grounded PRD, publishes to a fixed Confluence folder, and links back to Jira. Use when the user asks to build a PRD from a Jira ticket or PDDS key (e.g. PDDS-1, #PDDS-1).
---

# Ticket to PRD

Jira ticket → grounded PRD → Confluence → Jira comment. **PRD-only tasks do not change repo code.**

## Workflow

```
- [ ] 1. Fetch ticket (Jira MCP)
- [ ] 2. Ground in codebase + docs
- [ ] 3. Draft PRD
- [ ] 4. Publish to Confluence + comment on Jira
```

## Step 1: Fetch ticket

**Project:** [PDDS](https://fe-anysphere-demo.atlassian.net/jira/software/projects/PDDS/)  
**Cloud ID:** `564eb250-21c1-45d7-81f9-527d6bf705ad`

Read MCP schemas, then `getJiraIssue` (`fields: ["*all"]`, `expand: "renderedFields"`, markdown). Search related issues: `key = {KEY} OR parent = {KEY} OR "Epic Link" = {KEY}`.

## Step 2: Ground in codebase

Read `docs/*.md`, then map the ticket to current code (schema, routes, components) with concrete file paths for **Current State**.

## Step 3: Draft PRD

Number all sections. Use **Summary**, never "Executive Summary". No "Publish plan" section.

| # | Section |
|---|---------|
| 1 | Summary |
| 2 | Problem |
| 3 | Goals |
| 4 | Non-Goals |
| 5 | User Stories |
| 6 | Current State |
| 7 | Proposed Solution |
| 8 | Product Requirements (Must / Should / Out of scope) |
| 9 | UX Notes |
| 10 | Technical Design Notes |
| 11 | Acceptance Criteria (task-list checkboxes) |
| 12 | Risks and Trade-offs |
| 13 | Privacy Impact Assessment — data collected, storage/exposure, impact + mitigations |
| 14 | Security Review (ISO/SAE 21434) — assets, threats, controls, residual risk |
| 15 | Open Product Decisions |
| 16 | Implementation Phasing |
| 17 | API Appendix (if APIs change) |

## Step 4: Publish

**Confluence folder:** [PRDs](https://fe-anysphere-demo.atlassian.net/wiki/spaces/~712020b1ef99f3305c4f9c80655038f9122366/folder/150405121) — `parentId: 150405121`, `contentFormat: html`, title `PRD: {Feature} ({KEY})`. Search first; update existing page instead of duplicating.

`addCommentToJiraIssue` on the ticket with the Confluence URL and open decisions from §15.
