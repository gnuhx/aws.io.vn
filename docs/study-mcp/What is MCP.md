# What is MCP? The USB-C Port for AI Tools

---

## Concept

**MCP (Model Context Protocol)** is an open protocol that standardizes how AI applications
connect to external data sources and tools. Before MCP, every AI app that wanted to talk to
Slack, a database, or a filesystem had to write a custom, one-off integration. MCP replaces
those N×M custom integrations with one shared protocol — the same way USB-C replaced a drawer
full of proprietary charging cables.

Three roles make up every MCP setup:
- **Host** — the AI application the user talks to (e.g. Claude Code, Claude Desktop).
- **Client** — lives inside the host, keeps one 1:1 connection to a single server.
- **Server** — a lightweight program that exposes capabilities: tools, resources, and prompts.

## Building Blocks

| Primitive | What it is | Who calls it |
|---|---|---|
| **Tool** | A function the model can invoke (e.g. `create_issue`, `run_query`) | The model, autonomously |
| **Resource** | Read-only data the host can attach as context (e.g. a file, a DB row) | The application/user |
| **Prompt** | A reusable, parameterized prompt template the server exposes | The user, explicitly |

## Real Project Example

A team wants Claude to be able to read their internal ticket tracker and file new bugs.
Without MCP, that means a custom plugin per AI tool they use. With MCP, they write one MCP
server exposing a `create_ticket` tool and a `tickets://open` resource. Any MCP-compatible
host — Claude Code, Claude Desktop, a custom agent — can now use it immediately, with no
extra integration work.

## Funny Analogy

Before USB-C, every device came with its own charger: one for your phone, another for your
laptop, a third for that ancient camera nobody remembers buying. Every cable was proprietary,
and every new device meant a new cable in the drawer.

MCP is USB-C for AI tools. Instead of every AI app inventing its own private "plug" for
every tool it wants to use, the tool exposes one standard port. Plug any MCP-compatible AI
into it, and it just works — no adapter, no custom wiring, no drawer full of dead cables.

> **Pro tip:** The key mental model is 1 client ↔ 1 server. A host can run many clients at
> once to talk to many servers in parallel — that's how one AI app ends up connected to your
> filesystem, GitHub, and Slack simultaneously.
