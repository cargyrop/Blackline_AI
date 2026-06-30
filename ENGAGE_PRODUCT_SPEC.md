# ARKEL — Engage Product Spec

Date: 2026-06-30

## Overview

**Engage** is the central interaction layer of ARKEL. It replaces the legacy "Chat" concept with a full workspace where users can chat, explore files, manage model teams, and run engineering tasks — all from floating panels they can arrange to their preference.

## Engage Structure

```
┌─────────────────────────────────────────────────┐
│ TOOLBAR (System Prompt, Clear, Export, Tokens)  │
├─────────────────────────────────────────────────┤
│                                                  │
│  ENGAGE PANEL HOST                              │
│  ┌──────────────────────────────────────────┐   │
│  │ #messages (chat, scrollable)             │   │
│  │                                          │   │
│  │   floating panels overlay here:          │   │
│  │   ┌─────────┐  ┌──────────────┐         │   │
│  │   │  NEXUS  │  │  ENGINEERING │         │   │
│  │   │  files  │  │  tasks/runs  │         │   │
│  │   └─────────┘  └──────────────┘         │   │
│  │           ┌────────┐                     │   │
│  │           │  CREW  │                     │   │
│  │           │ roles  │                     │   │
│  │           └────────┘                     │   │
│  └──────────────────────────────────────────┘   │
│                                                  │
│ [ENGAGE PANEL BAR: ◈ NEXUS | ◬ CREW | ⬡ ENG]   │
│                                                  │
├─────────────────────────────────────────────────┤
│ INPUT AREA (model select, textarea, send/stop)  │
└─────────────────────────────────────────────────┘
```

## Floating Panels

### Panel: Nexus (◈)
**Purpose**: Universal file/project browser

**Current state**: Shell only — opens with placeholder content

**Future capabilities**:
- Browse current project files as a tree
- Preview file contents inline
- Attach files to Engage chat context
- Quick actions on selected files:
  - "Attach to conversation"
  - "Summarize"
  - "Save takeaway to memory"
  - "Save as rule draft"
  - "Include in Engineering context"
- Browse memory/skills/rules stores
- Browse engineering run artifacts

### Panel: Crew (◬)
**Purpose**: Model team and role management

**Current state**: Shell only — opens with placeholder content

**Immediate scope** (integrates existing Role Matrix):
- Show current role assignments (planner, executor, reviewer)
- Quick model assignment per role
- View ELO/capability summary for each assigned model

**Future scope**:
- Saved team presets (engineering, fusion, research, teach)
- Fusion team configuration
- Research mode team setup
- Teaching mode team setup

### Panel: Engineering (⬡)
**Purpose**: Engineering task creation and run monitoring

**Current state**: Shell only — opens with placeholder content

**Immediate scope** (integrates existing Evolve App):
- Create engineering task (describe what to build/change)
- Choose risk level / mode
- Monitor current and past runs
- Review plans and diffs
- Approve/reject execution
- View gate results and test output

**Future scope**:
- Project-scoped engineering tasks
- ARKEL self-modification tasks (root folder)
- Repair loop for failed patches
- Artifact inspection and download

## Panel UX Requirements

All floating panels must be:
- **Easy to open**: One click from the Engage Panel Bar at the bottom
- **Easy to close**: ✕ button in panel header
- **Easy to minimize**: ─ button collapses body, keeps header visible
- **Easy to rearrange**: Drag by header to reposition
- **Persistent layout**: Position, size, open/closed state saved to localStorage
- **Z-order management**: Clicking a panel brings it to front

## Panel State Model

```javascript
// localStorage key: 'floatingPanelLayout'
{
  nexus: { x: 20, y: 60, width: 340, height: 420, open: true },
  crew: { x: 380, y: 60, width: 320, height: 380, open: false },
  engineering: { x: 200, y: 180, width: 400, height: 450, open: false }
}
```

## Storage Architecture (Future)

```text
data/
├── config.json              # API keys, endpoint config
├── workspaces/
│   ├── engage/
│   │   └── <thread-id>/
│   │       ├── meta.json
│   │       ├── thread.md
│   │       └── artifacts/
│   ├── projects/
│   │   └── <project-id>/
│   │       ├── meta.json
│   │       ├── rules/
│   │       ├── memories/
│   │       ├── skills/
│   │       └── runs/
│   └── system/
│       └── arkel-root/
├── memory/
│   ├── global/
│   └── project/
├── skills/
│   ├── built-in/
│   └── custom/
├── rules/
│   ├── global/
│   └── project/
└── layouts/
    └── engage-layout.json
```

## Integration Points

### Immediate (Phase 3)
1. **Crew → Role Matrix**: Crew panel should mirror the existing Role Matrix panel content, but as a floating overlay inside Engage
2. **Engineering → Evolve**: Engineering panel should show the Evolve codebase tree and execution feed, but as a floating overlay inside Engage
3. **Nexus → File Tree**: Nexus panel should show a file tree similar to Evolve's codebase tree, but for the user's workspace

### Future (Phase 4+)
1. **Fusion**: Multi-model response mode in Engage chat
2. **Deep Research**: Research threads with citations
3. **Skill Execution**: `/teach`, `/summarize`, etc.
4. **Project Workspaces**: Each conversation maps to a project folder
5. **Memory/Rules/Skills Vault**: Persistent knowledge store

## Navigation Changes

The sidebar now has:
- **Engage** (was "Chat") — main interaction workspace
- **Model Hub** (was "Settings") — endpoint management, model center
- **Role Matrix** — will be folded into Crew panel later
- **Evolve App** — will be folded into Engineering panel later

During the transition, legacy panels remain accessible. Future work will remove the separate Role Matrix and Evolve App nav items once their content is fully integrated into Crew and Engineering floating panels.
