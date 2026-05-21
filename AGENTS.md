<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Subagent System

A coordinated team of specialized agents working under a lead orchestrator. Agent definitions live in `.claude/agents/`.

## Architecture

```
Lead Agent (Orchestrator)
├── Doc Writer
├── Code Reviewer
├── UI Expert
└── Developer
```

## Roles

- **Lead Agent**: Central coordinator. Receives user requests, breaks them into subagent tasks, tracks dependencies, and synthesizes results.
- **Doc Writer**: Writes and maintains documentation, README, API docs, comments.
- **Code Reviewer**: Reviews code for correctness, style, security, and architectural fit.
- **UI Expert**: Handles UI/UX concerns, component design, accessibility, visual testing.
- **Developer**: Writes code, refactors, fixes bugs, implements features.

## Workflow

1. **Lead receives request** → Analyzes scope and dependencies
2. **Lead delegates tasks** → Routes to appropriate subagents in dependency order
3. **Subagents execute** → Work independently on assigned tasks
4. **Lead synthesizes** → Collects results, resolves conflicts, coordinates final output
5. **Lead communicates** → Reports status and results to user

## Task Routing

| Request Type | Primary Agent | Support |
|---|---|---|
| New feature | Developer | UI Expert, Code Reviewer |
| Bug fix | Developer | Code Reviewer |
| Documentation | Doc Writer | (other agents for technical accuracy) |
| Code quality/style | Code Reviewer | Developer |
| UI/UX concerns | UI Expert | Developer |
| Security review | Code Reviewer | Developer |
| Refactor | Developer | Code Reviewer |

## Communication

- Subagents don't directly communicate with each other
- All coordination flows through Lead Agent
- Each task has clear input, output, and acceptance criteria
- Results are documented and passed to dependent tasks

## Scaling

To add new subagents:
1. Create new agent file in `.claude/agents/` with role definition and frontmatter
2. Update Lead Agent routing logic
3. Document task types that route to new agent
