# Jira / Atlassian MCP — Setup & Troubleshooting

Three separate systems. Do not conflate them.

| System | Purpose | Auth location |
|--------|---------|---------------|
| **Atlassian MCP** | Agent tools (`getJiraIssue`, Confluence search, etc.) | Desktop plugin **or** cloud tool selection |
| **Jira integration** | Trigger agents from Jira (`@Cursor`, assign to Cursor) | `cursor.com/dashboard/integrations` |
| **Jira personal link** | Per-user identity when "Require individual authentication" is ON | Triggered from Jira on first agent kickoff |

Local Desktop auth does **not** carry to cloud agents. Jira integration link does **not** auth Atlassian MCP.

---

## Admin setup

### Prerequisites (both local + cloud)
- Jira Commercial Cloud with **Rovo enabled** (typically Premium/Enterprise)
- Cursor **Teams** plan
- **Usage-based billing** enabled
- GitHub/GitLab (or Azure DevOps/Bitbucket) connected
- Atlassian admin: Rovo MCP Server enabled; optional API-token auth if skipping per-user OAuth

### Atlassian MCP (team definition — cloud)
1. [cursor.com/dashboard/integrations](https://cursor.com/dashboard/integrations) → **Team MCP Servers**
2. **Add MCP** → URL: `https://mcp.atlassian.com/v1/mcp`
3. *(Optional)* API token in `headers.Authorization: Basic <base64(email:rovo-mcp-token)>` for headless/team-wide auth

### Jira integration (triggers from Jira)
1. [cursor.com/dashboard/integrations](https://cursor.com/dashboard/integrations) → **Jira** → Connect
2. Install Cursor app from Atlassian Marketplace on the Jira site
3. In Jira: Cursor app → **Connections** → **Connect to Cursor**
4. Enable **Require individual authentication** if agents should run under each user's identity
5. [cursor.com/dashboard/cloud-agents](https://cursor.com/dashboard/cloud-agents) → set default repo, model, base branch, routing rules

---

## User setup

### Local IDE (Desktop)
1. Install **Atlassian** marketplace plugin (or add MCP URL `https://mcp.atlassian.com/v1/mcp`)
2. **Settings → Tools & MCP** → Atlassian → **Login** → complete OAuth
3. Verify: green status, tools listed, Logout visible

### Cloud agents
1. [cursor.com/agents](https://cursor.com/agents) → **New agent** composer (not an existing run)
2. **Tool selection** → **Jira** → **Login** → complete OAuth
3. Enable Jira/Atlassian in tool selection → start agent
4. **Start a new run** after auth — existing runs do not pick up new tokens

### Jira personal link (only if admin enabled individual auth)
1. In Jira: assign ticket to **Cursor** or comment `@Cursor`
2. Follow in-product prompt to link Jira account → Cursor account (same team)
3. Finish personal Cloud Agent settings: [cursor.com/dashboard/cloud-agents](https://cursor.com/dashboard/cloud-agents) → **My Settings**

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| MCP `needsAuth` in cloud agent | Cloud MCP OAuth not done | New agent → Tool selection → Jira → Login |
| MCP works locally, not in cloud | Separate auth stores | Auth in cloud tool selection, not Desktop only |
| Jira linked but MCP still `needsAuth` | Integration ≠ MCP | Complete MCP Login in cloud tool selection |
| `@Cursor` in Jira does nothing | Cursor app not configured in Jira | Jira Admin → Cursor app → Connect to Cursor |
| `@Cursor` doesn't autocomplete | App missing or Rovo off | Install app; confirm Rovo enabled on site |
| No personal auth prompt | Trigger never fired | Use assign-to-Cursor first; prompt appears after trigger |
| Agent starts but can't pick repo | Missing cloud agent config | Set default repo + routing rules in dashboard |
| "Couldn't determine repository" | No default/routing match | `@Cursor repo=org/repo` or add routing rule |
| Integration posts to Jira, agent has no Jira tools | Known split: integration creds ≠ MCP | Auth Atlassian MCP separately in cloud |
| Auth done but tools still missing | Stale run | Start **new** cloud agent after Login |
| Looking for MCP on integrations page | Wrong surface | OAuth is in **new agent → tool selection**, not Team MCP editor |
| Team MCP Add does nothing | Non-admin | Ask admin to add server, or use user-level auth in agents UI |

---

## Quick verify

- **Local:** Settings → Tools & MCP → Atlassian connected
- **Cloud:** New agent → tool selection → Jira connected → start run → agent can call `getJiraIssue` / `search`
- **Jira trigger:** Assign to Cursor → status on ticket + run in [cursor.com/agents](https://cursor.com/agents)
