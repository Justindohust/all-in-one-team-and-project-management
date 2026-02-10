---
name: swimlane-diagram-creator
description: "Professional swimlane diagram creation and editing in JSON format for process visualization. Use when Claude needs to work with swimlane/flowchart diagrams for: (1) Creating new process diagrams with phases and roles, (2) Editing existing diagram layouts, (3) Fixing node alignment and connection routing issues, (4) Converting process descriptions to visual diagrams, or any swimlane diagram task requiring proper coordinate calculation and human-like aesthetics."
---

# Swimlane Diagram Creation and Editing

## Overview

Create and edit swimlane diagrams in JSON format. Diagrams consist of phases (columns), roles (rows), nodes (process steps), and connections (flow lines). The goal is producing diagrams that look human-drawn with natural alignment and clean connection lines.

## Workflow Decision Tree

### Creating New Diagram
Use "Creating a new diagram" workflow

### Editing Existing Diagram  
- **Fixing alignment/layout issues**: Use "Editing layout" workflow
- **Adding/removing nodes**: Use "Modifying content" workflow

### Analyzing Diagram
Read JSON and use coordinate reference in [coordinate-system.md](references/coordinate-system.md)

## Creating a new diagram

### Workflow
1. **Gather requirements**: List all process steps, roles, phases, decision points
2. **Calculate dimensions**: Use formulas in [coordinate-system.md](references/coordinate-system.md)
3. **Place nodes**: Follow natural alignment principles (vary X ±20px)
4. **Add connections**: Ensure horizontal connections share same Y value
5. **Verify**: Check all nodes within boundaries, connections straight

### Quick Reference - JSON Structure
```json
{
  "phases": [{"id": "p1", "name": "Phase Name", "width": 298}],
  "roles": [{"id": "r1", "name": "Role", "icon": "fa-icon", "color": "#hex", "height": 120}],
  "nodes": [{"id": "n1", "type": "task", "operation": "external", "label": "Task", "x": 344, "y": 142}],
  "connections": [{"from": "n1", "to": "n2", "fromSide": "bottom", "toSide": "top"}]
}
```

## Editing layout

When fixing alignment or connection routing issues:

1. **Identify problems**: Crooked lines = misaligned Y values; overflow = wrong dimensions
2. **Read coordinate reference**: See [coordinate-system.md](references/coordinate-system.md) for calculation formulas
3. **Apply fixes**: Adjust coordinates following natural alignment principles
4. **Verify connections**: Horizontal connections must have identical Y values

## Modifying content

When adding/removing nodes:

1. **Update nodes array**: Add/remove node objects
2. **Recalculate spacing**: Adjust Y values to maintain ~60px spacing
3. **Update connections**: Add/remove connection objects
4. **Adjust role heights**: Recalculate if node count changed

## Core Principles

### Natural Alignment (NOT Rigid Grids)
```
❌ Rigid: X=320 for ALL nodes → looks mechanical
✅ Natural: X varies 302, 320, 334, 344 → looks human-drawn
```

### Straight Connection Lines
- **Vertical flow**: Nodes in same column must have close X values
- **Horizontal flow**: Nodes MUST have identical Y value

### Node Types & Operations
| Type | Shape | Operations |
|------|-------|-----------|
| start-end | Rounded | external |
| task | Rectangle | external, mes-action, mes-auto |
| decision | Diamond | external, mes-action |

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| All nodes same X | Vary X ±20px for organic feel |
| Crooked horizontal line | Set both nodes to same Y |
| Missing NG branch | Complete both decision branches |
| Node overflow | Increase role height |
| Text overflow | Add style.width/height |

## References

- **[coordinate-system.md](references/coordinate-system.md)**: Detailed coordinate calculation, dimension formulas, spacing rules
- **[example-diagram.json](references/example-diagram.json)**: Complete working example showing typical patterns
