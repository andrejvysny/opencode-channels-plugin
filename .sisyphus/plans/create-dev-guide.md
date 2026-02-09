# Create DEV_GUIDE.md for OpenCode Channels Plugin

## TL;DR

> **Quick Summary**: Create comprehensive development guide documenting OpenCode plugin architecture, local development methods, and debugging workflows.
> 
> **Deliverables**:
> - `DEV_GUIDE.md` with complete local plugin development instructions
> - Updated `AGENTS.md` with any missing patterns discovered
> 
> **Estimated Effort**: Quick
> **Parallel Execution**: NO - sequential
> **Critical Path**: Research complete → Write DEV_GUIDE.md

---

## Context

### Original Request
Analyze the current plugin implementation, research OpenCode plugin development practices, and create a DEV_GUIDE.md documenting how to set up a development environment for OpenCode plugins.

### Research Summary

**OpenCode Plugin Loading Mechanisms**:
1. **Local files**: `.opencode/plugins/` (project) or `~/.config/opencode/plugins/` (global) - auto-loaded at startup
2. **npm packages**: Listed in `opencode.json` under `"plugin"` array - installed via Bun to `~/.cache/opencode/node_modules/`

**Plugin Interface** (`@opencode-ai/plugin`):
- `Plugin` type: async function receiving `PluginInput`, returning `Hooks`
- `PluginInput`: `{ client, project, directory, worktree, serverUrl, $ }`
- `Hooks`: event handlers, tool definitions, auth flows, chat interceptors

**Key Hooks Available**:
- `event` - Subscribe to all OpenCode events
- `tool` - Add custom tools via `tool()` helper
- `config` - Modify configuration at startup
- `permission.ask` - Custom permission handling
- `tool.execute.before/after` - Tool execution interceptors
- `chat.message`, `chat.params` - Message interception

**Local Development Methods Discovered**:
1. **Plugin directory** - Drop `.ts/.js` files in `~/.config/opencode/plugins/`
2. **package.json dependency** - Add `"file:./path"` to `~/.config/opencode/package.json`
3. **Direct cache replacement** - Copy built plugin to `~/.cache/opencode/node_modules/`
4. **Wrapper file** - Create `.ts` that re-exports local build

**Current Plugin Implementation Analysis**:
- Exports default `ChannelsPlugin` following OpenCode plugin pattern
- Uses `event` hook for permission/session/message events
- Loads config from `channels.json` in config directories
- Persists state to `~/.config/opencode/channels-state.json`
- CLI commands for install/init/uninstall via Commander

---

## Work Objectives

### Core Objective
Create a comprehensive DEV_GUIDE.md that enables developers to set up local plugin development for OpenCode.

### Concrete Deliverables
- `/DEV_GUIDE.md` - Complete development guide (~200 lines)

### Definition of Done
- [ ] `cat DEV_GUIDE.md` shows all sections populated
- [ ] Document covers prerequisites, setup, 4 development methods, testing, debugging
- [ ] Includes quick start checklist

### Must Have
- Prerequisites section (Bun, Node, OpenCode)
- OpenCode plugin architecture explanation
- All 4 local development methods documented
- Testing and debugging workflows
- Configuration file examples
- Quick start checklist

### Must NOT Have (Guardrails)
- No placeholder text - all content must be complete
- No external dependencies documentation (keep focused on dev workflow)
- No implementation code changes

---

## Verification Strategy

### Test Decision
- **Infrastructure exists**: NO (no tests configured)
- **User wants tests**: Manual verification
- **Framework**: N/A

### Automated Verification

```bash
# Verify file exists and has content
test -f DEV_GUIDE.md && wc -l DEV_GUIDE.md | awk '$1 > 150 {print "PASS: " $1 " lines"}'

# Verify key sections exist
grep -c "## Prerequisites" DEV_GUIDE.md && \
grep -c "## Development Setup" DEV_GUIDE.md && \
grep -c "## Local Plugin Development Methods" DEV_GUIDE.md && \
grep -c "## Testing" DEV_GUIDE.md && \
grep -c "## Debugging" DEV_GUIDE.md && \
echo "PASS: All sections present"
```

---

## Execution Strategy

### Single Task - No Parallelization Needed

This is a documentation task with a single deliverable.

---

## TODOs

- [x] 1. Create DEV_GUIDE.md with complete development documentation

  **What to do**:
  Create `/Users/andrejvysny/opencode-workspace/opencode-channels-plugin/DEV_GUIDE.md` with the following structure:

  ```markdown
  # Development Guide - OpenCode Channels Plugin

  ## Table of Contents
  1. Prerequisites
  2. OpenCode Plugin Architecture
  3. Development Setup
  4. Local Plugin Development Methods
  5. Testing Your Plugin
  6. Debugging
  7. Publishing
  8. Quick Start Checklist

  ## Prerequisites
  - Bun v1.0+
  - Node.js v20+
  - OpenCode installed

  ## OpenCode Plugin Architecture
  - How plugins are loaded (local files vs npm)
  - Plugin load order
  - Plugin interface (PluginInput, Hooks)
  - Available hooks table
  - Event types list

  ## Development Setup
  - Clone and install
  - Build commands
  - Type check

  ## Local Plugin Development Methods
  - Method 1: Local File Plugin (wrapper in ~/.config/opencode/plugins/)
  - Method 2: package.json dependency with file: protocol
  - Method 3: bun link
  - Method 4: Direct cache replacement

  ## Testing Your Plugin
  - Verify plugin loads (--print-logs)
  - Test event handling
  - Test permission forwarding
  - Future: bun test setup

  ## Debugging
  - Enable debug logging
  - Plugin console output conventions
  - Structured logging with client.app.log
  - Common issues table

  ## Publishing
  - Version bump
  - Test before publish
  - npm publish
  - CI/CD workflows

  ## Directory Structure Reference
  - ~/.config/opencode/ layout
  - ~/.cache/opencode/ layout

  ## Configuration Files
  - opencode.json example
  - channels.json example

  ## Quick Start Checklist
  - [ ] Clone and bun install
  - [ ] bun run build
  - [ ] Set up local development method
  - [ ] Create channels.json
  - [ ] Add to opencode.json
  - [ ] Start with --print-logs
  - [ ] Test with channels start
  ```

  **Content to include** (from research):
  
  1. **Plugin Loading**: OpenCode loads from `.opencode/plugins/` and `~/.config/opencode/plugins/` automatically, plus npm packages from `opencode.json` plugin array
  
  2. **Plugin Interface**:
  ```typescript
  import type { Plugin, PluginInput, Hooks } from "@opencode-ai/plugin";
  
  const MyPlugin: Plugin = async (input: PluginInput): Promise<Hooks> => {
    // input.client - OpenCode SDK client
    // input.project - Current project
    // input.directory - Current working directory
    // input.worktree - Git worktree path
    // input.$ - Bun shell API
    // input.serverUrl - OpenCode server URL
    return { event: async ({ event }) => { ... } };
  };
  ```

  3. **Local Dev Methods**:
     - Wrapper: `~/.config/opencode/plugins/channels-dev.ts` that exports from local build
     - file: protocol in package.json dependencies
     - bun link
     - Direct copy to ~/.cache/opencode/node_modules/

  4. **Debugging**: `opencode --print-logs --log-level DEBUG`, `[PluginName]` console prefix convention

  **Must NOT do**:
  - No incomplete sections with TODO markers
  - No external links that may break

  **Recommended Agent Profile**:
  - **Category**: `writing`
    - Reason: Documentation creation task
  - **Skills**: `[]`
    - No specialized skills needed

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: N/A - single task
  - **Blocks**: None
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `src/index.ts:57-259` - Plugin implementation pattern showing PluginInput usage, Hooks structure, event handling
  - `src/cli.ts:1-172` - CLI structure for install/init/uninstall commands

  **API/Type References**:
  - `~/.config/opencode/node_modules/@opencode-ai/plugin/dist/index.d.ts` - Complete Plugin, PluginInput, Hooks type definitions
  - `src/config/schema.ts:1-61` - Zod schema patterns for configuration

  **Documentation References**:
  - OpenCode docs: https://opencode.ai/docs/plugins/ - Official plugin documentation
  - `README.md:1-186` - Existing user documentation for this plugin

  **WHY Each Reference Matters**:
  - `src/index.ts` shows the actual implementation pattern this project uses
  - Plugin type definitions show all available hooks
  - README shows current documentation style to match

  **Acceptance Criteria**:
  
  ```bash
  # Agent runs:
  test -f DEV_GUIDE.md && echo "PASS: File exists"
  
  # Verify line count > 150
  wc -l DEV_GUIDE.md | awk '{if ($1 > 150) print "PASS: " $1 " lines"; else print "FAIL: only " $1 " lines"}'
  
  # Verify all major sections present
  for section in "Prerequisites" "Plugin Architecture" "Development Setup" "Local Plugin Development" "Testing" "Debugging" "Publishing" "Quick Start"; do
    grep -q "$section" DEV_GUIDE.md && echo "PASS: $section section found" || echo "FAIL: $section missing"
  done
  ```

  **Commit**: YES
  - Message: `docs: add DEV_GUIDE.md for local plugin development`
  - Files: `DEV_GUIDE.md`
  - Pre-commit: `bun run typecheck`

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 1 | `docs: add DEV_GUIDE.md for local plugin development` | DEV_GUIDE.md | grep sections |

---

## Success Criteria

### Verification Commands
```bash
# File exists with sufficient content
test -f DEV_GUIDE.md && wc -l DEV_GUIDE.md  # Expected: > 150 lines

# All sections present
grep -c "## " DEV_GUIDE.md  # Expected: >= 8 sections
```

### Final Checklist
- [ ] DEV_GUIDE.md created with all sections
- [ ] Prerequisites documented
- [ ] All 4 local development methods explained
- [ ] Testing and debugging workflows included
- [ ] Quick start checklist at end
