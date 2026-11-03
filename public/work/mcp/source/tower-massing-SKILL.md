---
name: tower-massing
description: Architecture tower massing generator in Rhino. Parametric typologies (hourglass, twist, stepped, atrium, etc.) with evolutionary fresh/lock/next workflow on a progressive 2x2→5x5 grid.
---

# Tower Massing Generator

Rhino tower massing exploration tool. 2x2 initial generation, evolutionary growth via lock/next, curated typologies with parametric dial variations.

## Setup
- Requires Rhino + Grasshopper MCP running
- Verify with `mcp__grasshopper__rhino_status` before any command

## Commands

| Command | Action |
|---|---|
| `/tower-massing` | Load engine + fresh Gen 0 (2x2, 4 random typologies) |
| `/tower-massing refresh` (or `fresh`) | Re-roll current gen (new random typologies + dials) |
| `/tower-massing lock` | Use selected Rhino objects as parents → add next gen (perimeter cells, parent typology + dial variations, inherits lineage color) |
| `/tower-massing next` | If selection: same as lock. If no selection: add next gen with FRESH RANDOM typologies (new exploration, new palette colors) |
| `/tower-massing typology <name>` | Generate 4 variations of one typology (dial-varied) |
| `/tower-massing list` | Print typology catalog |

## Execution Flow

1. Check if engine loaded: `sc.sticky.get("v11_loaded")`
2. If not loaded, paste full `scripts/massing.py` into `mcp__grasshopper__rhino_execute_python`
3. Then run the appropriate command function: `sc.sticky["v11_fresh"]()` etc.

## Architecture

```
Grid:        Corner-anchored, cells ~262.5 ft × ~262.5 ft (80m), growing from 2x2 to 5x5 perimeter at a time
Tower:       40 floors × ~9.84 ft = ~393.7 ft (40 × 3m = 120m). Slab thickness ~0.49 ft
Units:       Rhino doc unit is FEET. Typology builders work in abstract units; finalize_option scales by M2FT = 3.28084
Layers:      TowerOptions::Opt_NN::Mass  / TowerOptions::Opt_NN::Slabs
Label:       TextDot (number, lineage color) above mass + TextEntity (5-line, black) at cell south
```

## Typology Catalog (24)

### Smooth / Lofted
- `slim_slab` — slim rectangular slab with subtle top setback (residential)
- `twisted_square` — square plan with 60° twist + 15% taper
- `extreme_twist` — slab plan with 90° twist (Cayan Tower)
- `curved_slab` — rectangle with one long face bowed outward (Aqua Tower)
- `hourglass` — pinched-waist profile (lofted 22→12→22)

### Stepped / Stacked
- `wedding_cake` — 3-tier ziggurat (22/16/12)
- `inverted_step` — reverse ziggurat (16→19→22, wider on top)
- `stepped_helix` — 4 setbacks each rotated 30°
- `stacked_cubes` — 3 cubes 14/12/10 rotated 0/22.5/45°
- `rotated_stack` — 4 blocks 18→12 rotated 0/45/90/135°
- `pinwheel` — 4 quadrant volumes at different heights (120/96/72/48)
- `splayed_base` — wider trapezoid base + slim tower

### Carved / Void
- `atrium` — rectangle with central vertical void (F8-F30)
- `notched_mid` — rectangle with deep mid-height notch
- `vertical_slot` — top-down vertical slot through tower
- `sliced_top` — diagonal slice at top (30°)

### Composite / Connected
- `twin_tower` — two slabs + top bridge
- `asym_twin` — two slabs at different heights (120/84)
- `canti_bridge` — two slim towers + top horizontal bridge (CCTV-inspired)
- `mega_cantilever` — slim base + massive cantilever upper (F28-F40, ~33 ft overhang)
- `folded_plate` — V-plan: two slabs meeting at 60°

### Single-mass
- `prism` — straight extrusion (square/rectangle/triangle)
- `cross_plan` — plus/cross plan extruded full height
- `t_crown` — slim tower + perpendicular crown block
- `plinth_tower` — wide low plinth + slim tower above
- `beveled_top` — rectangle + chamfered top 6 floors

## Typology Parameters

Each typology takes optional dial params with reasonable defaults. `fresh` randomizes within bounds:

```python
# Example: hourglass
hourglass(
    base_size=22,         # 18-26
    waist_size=12,        # 8-15
    waist_z_ratio=0.5,    # 0.4-0.6
)
```

See `scripts/massing.py` for full dial ranges.

## Lineage Colors

Gen 0 slots → fixed palette:
- Slot 0: red `(230,80,80)`
- Slot 1: blue `(80,140,230)`
- Slot 2: green `(80,200,120)`
- Slot 3: yellow `(230,180,60)`

Lock/Next children inherit parent's color → visual evolutionary tracking.

## Workflow Rules

- Grid grows 2x2 → 3x3 → 4x4 → 5x5 (corner-anchored)
- Each new generation adds only the perimeter cells (right column + top row)
- Lock state persists: after lock, next call without selection continues with same parents
- Fresh always resets state and wipes canvas

## State Storage

All in `sc.sticky` under `v11_*` keys:
- `v11_loaded`, `v11_typology_funcs`, `v11_fresh`, `v11_lock`, `v11_next`
- `v11_generations`, `v11_option_typology`, `v11_option_dials`, `v11_option_color`, `v11_option_cell`
- `v11_gen_seed`, `v11_next_opt`

## Files

- `scripts/massing.py` — All-in-one engine: helpers, typologies, workflow
