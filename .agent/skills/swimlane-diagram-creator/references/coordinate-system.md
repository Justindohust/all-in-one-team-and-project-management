# Coordinate System Reference

Detailed coordinate calculation, dimension formulas, and spacing rules for swimlane diagrams.

## Table of Contents
1. [Canvas Coordinate System](#canvas-coordinate-system)
2. [Phase Width Calculation](#phase-width-calculation)
3. [Role Height Calculation](#role-height-calculation)
4. [Node X Positioning](#node-x-positioning)
5. [Node Y Positioning](#node-y-positioning)
6. [Connection Routing](#connection-routing)
7. [Node Styling](#node-styling)

---

## Canvas Coordinate System

### Layout Structure
```
┌─────────────────────────────────────────────────────┐
│  Container offset: left=80px, top=80px              │
│  ┌───────────┬──────────────┬──────────────┐        │
│  │ Role Col  │   Phase 1    │   Phase 2    │ ← Header: 40px
│  │  160px    │   width: W1  │   width: W2  │        │
│  ├───────────┼──────────────┼──────────────┤        │
│  │ Role 1    │              │              │ height: H1
│  ├───────────┼──────────────┼──────────────┤        │
│  │ Role 2    │              │              │ height: H2
│  ├───────────┼──────────────┼──────────────┤        │
│  │ Role 3    │              │              │ height: H3
│  └───────────┴──────────────┴──────────────┘        │
└─────────────────────────────────────────────────────┘
```

### Key Constants
| Element | Value | Notes |
|---------|-------|-------|
| Container left offset | 80px | From canvas edge |
| Container top offset | 80px | From canvas edge |
| Role column width | 160px | Reserved for role labels |
| Phase header height | 40px | Top row for phase names |

### Coordinate Origin
- **X = 0**: Left edge of canvas (NOT left edge of swimlane content)
- **Y = 0**: Top edge of canvas (NOT top edge of first row)
- **Content area X starts**: ~240px (80 offset + 160 role column)
- **Content area Y starts**: ~120px (80 offset + 40 header)

---

## Phase Width Calculation

### Formula
```
phase_width = max_node_width + left_padding + right_padding + (branch_columns × column_width)
```

### Guidelines
| Layout Type | Calculation | Example |
|-------------|-------------|---------|
| Single column | 120 + 40 + 40 | 200px minimum |
| Two columns | 120 + 120 + 60 | 300px minimum |
| Three columns | 120 × 3 + 80 | 440px minimum |

### Real Examples
```json
{"id": "p1", "name": "Phase 1", "width": 300}      // Single main + 1 branch
{"id": "p2", "name": "Phase 2", "width": 400}      // Two main columns
```

---

## Role Height Calculation

### Formula
```
role_height = (node_count × avg_node_height) + ((node_count - 1) × spacing) + top_padding + bottom_padding
```

### Component Values
| Component | Typical Value |
|-----------|---------------|
| Node height | 40-60px |
| Spacing between nodes | 50-60px |
| Top/bottom padding | 20px each |

### Calculation Example
For role with 5 nodes:
```
height = (5 × 50) + (4 × 55) + 20 + 20
       = 250 + 220 + 40
       = 510px
```

### Real Examples
```json
{"id": "r1", "name": "Role A", "height": 180}    // 2 nodes
{"id": "r2", "name": "Role B", "height": 200}    // 3 nodes  
{"id": "r3", "name": "Role C", "height": 400}    // 10+ nodes
```

---

## Node X Positioning

### Phase 1 X Calculation (starts at ~240px)
| Position | Formula | Example |
|----------|---------|---------|
| Center | 240 + (width/2) | 240 + 150 = 390 → use ~344 |
| Left column | 240 + 60 | ~300 |
| Right column | 240 + 160 | ~400 |

### Phase 2 X Calculation (starts at ~540px with 300px phase 1)
| Position | Formula | Example |
|----------|---------|---------|-----|
| Center | 540 + (width/2) | 540 + 200 = 740 → use ~687 |
| Left column | 540 + 60 | ~600 |
| Right column | 540 + 200 | ~740 |

### Natural Variation Rule
**CRITICAL**: Do NOT use exact same X for all nodes in a column.

```
❌ Mechanical: 344, 344, 344, 344, 344
✅ Natural: 344, 302, 334, 410, 264
```

Allow ±20-40px variation while maintaining visual alignment.

---

## Node Y Positioning

### Y Boundaries by Role
| Role | Y Start | Y End | Notes |
|------|---------|-------|-------|
| Role 1 (h=180) | 120 | 300 | After header |
| Role 2 (h=200) | 300 | 500 | After role 1 |
| Role 3 (h=400) | 500 | 900 | After role 2 |

### Spacing Pattern
```
Node 1 (start):    Y = 142  (role start + 22)
Node 2:            Y = 197  (+55)
Node 3:            Y = 262  (+65)
Node 4:            Y = 340  (+78) ← larger gap OK
Node 5 (decision): Y = 439  (+99) ← extra space before decision
Node 6 (branch):   Y = 454  (+15) ← same level as decision for OK branch
```

### Horizontal Alignment Rule
**CRITICAL**: Nodes connected horizontally MUST share same Y value.

```
Decision node:     Y = 439
OK Branch node:    Y = 454  // Close but NOT same = diagonal line ❌

CORRECT:
Decision node:     Y = 454
OK Branch node:    Y = 454  // Same Y = straight horizontal line ✅
```

---

## Connection Routing

### fromSide/toSide Reference
| Flow Direction | fromSide | toSide | Result |
|----------------|----------|--------|--------|
| Down (sequential) | bottom | top | Vertical line |
| Right (OK branch) | right | left | Horizontal line |
| Up (return) | top | bottom | Vertical line up |
| Left (rare) | left | right | Horizontal line |

### Decision Node Pattern
```json
// OK branch - goes RIGHT
{
  "from": "decision_id",
  "to": "ok_node_id", 
  "fromSide": "right",
  "toSide": "left",
  "label": "OK"
}

// NG branch - goes DOWN
{
  "from": "decision_id",
  "to": "ng_node_id",
  "fromSide": "bottom", 
  "toSide": "top",
  "label": "NG"
}
```

### Parallel Flow Pattern
```json
// Single source → two parallel nodes
{
  "from": "source_node",
  "to": "left_branch",
  "fromSide": "bottom",
  "toSide": "top"
},
{
  "from": "source_node",
  "to": "right_branch",
  "fromSide": "bottom",
  "toSide": "top"
}
```

### Return/Loop Pattern
```json
// Return up from child to parent
{
  "from": "child_node",
  "to": "parent_node",
  "fromSide": "top",
  "toSide": "bottom"
}
```

---

## Node Styling

### Default Sizes
| Node Type | Width | Height |
|-----------|-------|--------|
| start-end | 100px | 40px |
| task | 120px | 40px |
| decision | 100px | 50px |

### Custom Style for Long Text
```json
{
  "id": "node_multiline",
  "type": "task",
  "label": "Tự động tạo phiếu\nnhập kho sau IQC",
  "x": 753,
  "y": 634,
  "style": {
    "width": 147,
    "height": 61,
    "textAlign": "center"
  }
}
```

### When to Add Custom Style
- Label has `\n` (newline)
- Label text > 20 characters
- Decision node with long question
- Need specific alignment

### Operation Types
| Operation | Visual | Usage |
|-----------|--------|-------|
| external | Default gray | Manual human actions |
| mes-action | Blue | User actions in MES system |
| mes-auto | Green | Automatic system actions |

---

## Quick Calculation Checklist

Before placing nodes:
- [ ] Calculate total width: role_col(160) + sum(phase_widths)
- [ ] Calculate total height: header(40) + sum(role_heights)
- [ ] Identify X range for each phase
- [ ] Identify Y range for each role

While placing nodes:
- [ ] X within phase boundary ±20px natural variation
- [ ] Y within role boundary
- [ ] Horizontal connections: same Y
- [ ] Vertical connections: close X
- [ ] 50-60px minimum spacing between nodes
