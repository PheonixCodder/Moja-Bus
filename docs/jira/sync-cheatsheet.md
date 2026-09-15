# ⚡ Moja Ride — Jira Synchronization & Composio Cheatsheet

This cheatsheet provides the exact commands, tool calls, and JQL patterns for developers and AI agents to query, create, and update Jira issues through Composio without leaving the IDE.

---

## 🛠️ Composio Jira Tool Reference

We use the Composio Jira integration via the `tank` session:

| Tool Slug | Purpose | Example Use Case |
| :--- | :--- | :--- |
| `JIRA_GET_ALL_PROJECTS` | List visible projects | Verify access or find project IDs |
| `JIRA_GET_PROJECT` | Inspect project details | Check available issue types, lead, components |
| `JIRA_SEARCH_FOR_ISSUES_USING_JQL_GET` | Query issues via JQL | Search issues by status, assignee, or epic |
| `JIRA_GET_ISSUE` | Read a specific issue | Fetch full description, subtasks, attachments |
| `JIRA_FETCH_BULK_ISSUES` | Fetch multiple issues | Rapidly inspect batches of tickets |
| `COMPOSIO_SEARCH_TOOLS` | Search more Jira capabilities | Find creation, transition, or update tools |

---

## 🔍 Essential JQL Queries

When searching for issues using `JIRA_SEARCH_FOR_ISSUES_USING_JQL_GET`, use these standard JQL strings:

```jql
# 1. All open issues in Moja Ride
project = SCRUM AND status != Done ORDER BY priority DESC, created DESC

# 2. Issues assigned to current user
project = SCRUM AND assignee = currentUser() AND status != Done

# 3. All epics in the project
project = SCRUM AND issuetype = Epic ORDER BY created ASC

# 4. In Progress work
project = SCRUM AND status = "In Progress"

# 5. High priority or blocker items
project = SCRUM AND priority in (High, Highest) AND status != Done
```

---

## 🤖 AI Agent Workflow Rules

When an AI agent is working on a Jira task:

1. **Before writing code**:
   * Fetch the ticket details (`JIRA_GET_ISSUE` or JQL) to review acceptance criteria.
   * Verify the component and related context files in `context/`.
2. **During development**:
   * Keep the branch named appropriately (`feat/SCRUM-<id>-...`).
3. **After completion**:
   * Run typecheck and linting.
   * Provide a concise closing comment summarizing the solution and files modified.
   * Update the status and mirror the progress in `docs/jira/backlog-and-epics.md`.
