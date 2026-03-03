# Plugins Specification

> Living document. Last updated: 2026-03-01

## What is a Plugin?

A plugin extends the agent's runtime capabilities. While skills teach *how* to do something, plugins provide *tools* to do it -- actual executable functionality the agent can invoke.

## Plugin vs Skill

| Aspect | Skill | Plugin |
|--------|-------|--------|
| Nature | Instructions (knowledge) | Executable (tools) |
| Format | Markdown + examples | Scripts + config |
| Invocation | Loaded into context | Called as tool |
| Output | Guides agent behavior | Returns data/results |
| Example | "How to write a migration" | "Parse schema.rb and return table definitions" |

## Plugin Structure

Each plugin is a directory under `plugins/`:

```
plugins/
└── <plugin-name>/
    ├── PLUGIN.md         # Plugin description, capabilities, usage
    ├── scripts/          # Executable scripts
    └── config.yaml       # Plugin configuration (optional)
```

## Plugin Invocation

Plugins are invoked by the executor via shell commands. The agent:

1. Reads `PLUGIN.md` to understand available capabilities
2. Calls the relevant script with appropriate arguments
3. Parses the output (JSON or structured text)
4. Uses the result to inform its next action

## Open Questions

- [ ] Should plugins be installable from a registry?
- [ ] How to handle plugins that need gems not in the project's Gemfile?
- [ ] Should plugins run in a sandboxed environment?
- [ ] How to compose plugins (e.g., analyze -> refactor -> test)?
- [ ] Should plugins have a standard output format?
