"""Tower Massing Generator — self-contained engine for Rhino MCP.

Load this entire file via mcp__grasshopper__rhino_execute_python.
Stores helpers, typologies, and workflow functions in sc.sticky under v11_* keys.
"""

import scriptcontext as sc
import rhinoscriptsyntax as rs
import Rhino
import Rhino.Geometry as rg
import random
import math
import re
import time
import System


# ============================================================
# CONSTANTS
# ============================================================
PARENT_LAYER = "TowerOptions"

# Internal abstract dimensions used by typology builders.
# Body breps are uniformly scaled by M2FT in finalize_option so the final
# geometry lives in feet (Rhino doc unit).
CELL_SIZE = 80.0
N_FLOORS = 40
FLOOR_H = 3.0
TOTAL_H = N_FLOORS * FLOOR_H
SLAB_THICK = 0.15

# Feet-scaled versions used outside typology builders (grid, slabs, labels)
M2FT = 3.28084
CELL_FT       = CELL_SIZE  * M2FT   # ~262.5 ft
FLOOR_H_FT    = FLOOR_H    * M2FT   # ~9.84 ft
TOTAL_H_FT    = TOTAL_H    * M2FT   # ~393.7 ft
SLAB_THICK_FT = SLAB_THICK * M2FT   # ~0.49 ft
import colorsys

def _generate_palette(n):
    """Generate n distinct colors evenly distributed in hue."""
    palette = []
    for i in range(n):
        h = (i / float(n)) % 1.0
        # Alternate saturation/lightness to add variety
        s = 0.65 + 0.20 * ((i % 3) / 2.0)
        v = 0.80 + 0.15 * ((i % 2) / 1.0)
        r, g, b = colorsys.hsv_to_rgb(h, s, v)
        palette.append((int(r * 255), int(g * 255), int(b * 255)))
    return palette

# Initial palette (regenerated below once TYPOLOGIES is defined)
PALETTE = _generate_palette(36)


def typology_color(typology):
    """Same typology → same unique color. One palette entry per typology."""
    names = sorted(TYPOLOGIES.keys()) if "TYPOLOGIES" in globals() else []
    if typology in names:
        return PALETTE[names.index(typology) % len(PALETTE)]
    s = sum(ord(c) for c in typology)
    return PALETTE[s % len(PALETTE)]


# ============================================================
# SHAPE PRIMITIVES
# ============================================================
def rect_curve(w, h, ox=0, oy=0, rot=0):
    pts = [rg.Point3d(-w/2, -h/2, 0), rg.Point3d(w/2, -h/2, 0),
           rg.Point3d(w/2, h/2, 0), rg.Point3d(-w/2, h/2, 0),
           rg.Point3d(-w/2, -h/2, 0)]
    crv = rg.PolylineCurve(pts)
    if rot != 0:
        crv.Transform(rg.Transform.Rotation(rot, rg.Vector3d.ZAxis, rg.Point3d.Origin))
    if ox != 0 or oy != 0:
        crv.Transform(rg.Transform.Translation(ox, oy, 0))
    return crv


def square_curve(size, ox=0, oy=0, rot=0):
    return rect_curve(size, size, ox, oy, rot)


def triangle_curve(size):
    s = size / 2
    pts = [rg.Point3d(s*math.cos(2*math.pi*k/3 + math.pi/2),
                      s*math.sin(2*math.pi*k/3 + math.pi/2), 0) for k in range(3)]
    pts.append(pts[0])
    return rg.PolylineCurve(pts)


# ============================================================
# LAYER + FINALIZE
# ============================================================
def ensure_layer(name, parent=None):
    full = (parent + "::" + name) if parent else name
    if not rs.IsLayer(full):
        rs.AddLayer(name, parent=parent)
    return full


def wipe_all():
    layers = []
    for layer in list(sc.doc.Layers):
        if not layer.IsDeleted and (layer.FullPath == PARENT_LAYER or layer.FullPath.startswith(PARENT_LAYER + "::")):
            layers.append(layer.FullPath)
    for full in layers:
        objs = rs.ObjectsByLayer(full)
        if objs:
            rs.DeleteObjects(objs)
    text_ids = []
    for obj in sc.doc.Objects:
        g = obj.Geometry
        if isinstance(g, rg.TextEntity) or isinstance(g, rg.TextDot):
            text_ids.append(obj.Id)
    for tid in text_ids:
        sc.doc.Objects.Delete(tid, True)


def finalize_option(opt_num, center_pt, body_breps, color):
    """Translate bodies to world cell, add to layers, generate slabs, add textdot. Filters floating (ungrounded) breps."""
    # Scale bodies abstract→feet (typology builders produce abstract-scale geometry)
    xform_m2ft = rg.Transform.Scale(rg.Plane.WorldXY, M2FT, M2FT, M2FT)
    for b in body_breps:
        b.Transform(xform_m2ft)
    for b in body_breps:
        b.Translate(center_pt.X, center_pt.Y, 0)
    # Filter: keep grounded + any non-grounded brep whose bbox overlaps a grounded one (e.g. bridge supported by towers)
    grounded = [b for b in body_breps if b.GetBoundingBox(True).Min.Z <= 1.0]
    if grounded:
        supported = []
        for ng in body_breps:
            if ng in grounded: continue
            ng_bb = ng.GetBoundingBox(True)
            for g in grounded:
                g_bb = g.GetBoundingBox(True)
                if (ng_bb.Min.X <= g_bb.Max.X and ng_bb.Max.X >= g_bb.Min.X and
                    ng_bb.Min.Y <= g_bb.Max.Y and ng_bb.Max.Y >= g_bb.Min.Y and
                    ng_bb.Min.Z <= g_bb.Max.Z and ng_bb.Max.Z >= g_bb.Min.Z):
                    supported.append(ng); break
        body_breps = grounded + supported
    opt_layer = ensure_layer("Opt_{:02d}".format(opt_num), parent=PARENT_LAYER)
    mass_layer = ensure_layer("Mass", parent=opt_layer)
    slab_layer = ensure_layer("Slabs", parent=opt_layer)
    li_m = sc.doc.Layers.FindByFullPath(mass_layer, -1)
    li_s = sc.doc.Layers.FindByFullPath(slab_layer, -1)
    mass_attr = Rhino.DocObjects.ObjectAttributes()
    mass_attr.LayerIndex = li_m
    slab_attr = Rhino.DocObjects.ObjectAttributes()
    slab_attr.LayerIndex = li_s

    for b in body_breps:
        sc.doc.Objects.AddBrep(b, mass_attr)

    # Shift contour plane up by tiny epsilon — avoids coplanar misses
    # (e.g. canti_bridge's bottom face coincides with a slab Z level)
    EPS = 0.01
    bp = rg.Point3d(center_pt.X, center_pt.Y, EPS)
    tp = rg.Point3d(center_pt.X, center_pt.Y, TOTAL_H_FT - FLOOR_H_FT + EPS)
    for b in body_breps:
        contours = rg.Brep.CreateContourCurves(b, bp, tp, FLOOR_H_FT)
        # Group contours by Z level (outer + inner hole curves at same Z)
        z_groups = {}
        for c in contours:
            if c is None: continue
            z = round(c.GetBoundingBox(True).Min.Z, 1)
            z_groups.setdefault(z, []).append(c)
        def _is_nested(outer, inner):
            ob = outer.GetBoundingBox(True); ib = inner.GetBoundingBox(True)
            return (ob.Min.X < ib.Min.X + 0.01 and ob.Max.X > ib.Max.X - 0.01 and
                    ob.Min.Y < ib.Min.Y + 0.01 and ob.Max.Y > ib.Max.Y - 0.01)

        def _make_donut_slab(outer, inners):
            vec_thick = rg.Vector3d(0, 0, SLAB_THICK_FT)
            outer_top = outer.DuplicateCurve(); outer_top.Transform(rg.Transform.Translation(0, 0, SLAB_THICK_FT))
            inner_tops = []
            for ic in inners:
                ict = ic.DuplicateCurve(); ict.Transform(rg.Transform.Translation(0, 0, SLAB_THICK_FT))
                inner_tops.append(ict)
            bot_planar = rg.Brep.CreatePlanarBreps([outer] + inners, sc.doc.ModelAbsoluteTolerance)
            top_planar = rg.Brep.CreatePlanarBreps([outer_top] + inner_tops, sc.doc.ModelAbsoluteTolerance)
            if not bot_planar or not top_planar: return None
            outer_wall = rg.Surface.CreateExtrusion(outer, vec_thick)
            parts = list(bot_planar) + list(top_planar)
            if outer_wall: parts.append(outer_wall.ToBrep())
            for ic in inners:
                iw = rg.Surface.CreateExtrusion(ic, vec_thick)
                if iw: parts.append(iw.ToBrep())
            joined = rg.Brep.JoinBreps(parts, sc.doc.ModelAbsoluteTolerance)
            if joined and len(joined) > 0:
                sl = joined[0]
                try: sl.MergeCoplanarFaces(sc.doc.ModelAbsoluteTolerance)
                except: pass
                return sl
            return None

        for z, crvs in z_groups.items():
            try:
                # Group curves into (outer, [inner_holes]) clusters
                crvs_sorted = sorted(crvs, key=lambda c: -((c.GetBoundingBox(True).Max.X - c.GetBoundingBox(True).Min.X) + (c.GetBoundingBox(True).Max.Y - c.GetBoundingBox(True).Min.Y)))
                groups = []
                for c in crvs_sorted:
                    placed = False
                    for g in groups:
                        if _is_nested(g[0], c):
                            g[1].append(c); placed = True; break
                    if not placed:
                        groups.append([c, []])
                # Build a slab per group
                for outer, inners in groups:
                    if inners:
                        sl = _make_donut_slab(outer, inners)
                        if sl: sc.doc.Objects.AddBrep(sl, slab_attr)
                    else:
                        ext = rg.Extrusion.Create(outer, SLAB_THICK_FT, True)
                        if ext is None: continue
                        sb = ext.ToBrep(False)
                        if sb is None: continue
                        sc.doc.Objects.AddBrep(sb, slab_attr)
            except:
                pass

    dot = rg.TextDot(str(opt_num), rg.Point3d(center_pt.X, center_pt.Y, TOTAL_H_FT + 8 * M2FT))
    dot.FontHeight = 22
    da = mass_attr.Duplicate()
    da.ObjectColor = System.Drawing.Color.FromArgb(255, color[0], color[1], color[2])
    da.ColorSource = Rhino.DocObjects.ObjectColorSource.ColorFromObject
    sc.doc.Objects.AddTextDot(dot, da)


def cap_first(s):
    if not s:
        return s
    return s[0].upper() + s[1:]


def find_gen(opt):
    for idx, gen in enumerate(sc.sticky.get("v11_generations", [])):
        if opt in gen["options"]:
            return idx
    return None


def add_label(opt, cell_i, cell_j):
    typology = sc.sticky["v11_option_typology"].get(opt, "?")
    dials = sc.sticky["v11_option_dials"].get(opt, {})
    gen_idx = find_gen(opt)
    cx = cell_i * CELL_FT + CELL_FT / 2
    cy = cell_j * CELL_FT + CELL_FT / 2
    pt = rg.Point3d(cx, cy - 35 * M2FT, 0)
    plane = rg.Plane(pt, rg.Vector3d.ZAxis)
    dial_str = " ".join("{}={}".format(k, round(v, 2) if isinstance(v, float) else v) for k, v in sorted(dials.items())) if dials else "(default)"
    content = "Gen {}\nTypology: {}\nDials: {}\nOption: {}".format(
        gen_idx, cap_first(typology), dial_str, opt)
    text = rg.TextEntity()
    text.Plane = plane
    text.Text = content
    text.TextHeight = 1.8 * M2FT
    try:
        text.Justification = rg.TextJustification.BottomCenter
    except:
        pass
    layer_path = "TowerOptions::Opt_{:02d}::Mass".format(opt)
    li = sc.doc.Layers.FindByFullPath(layer_path, -1)
    if li < 0:
        return
    attr = Rhino.DocObjects.ObjectAttributes()
    attr.LayerIndex = li
    attr.ObjectColor = System.Drawing.Color.FromArgb(255, 0, 0, 0)
    attr.ColorSource = Rhino.DocObjects.ObjectColorSource.ColorFromObject
    sc.doc.Objects.AddText(text, attr)


# ============================================================
# TYPOLOGIES (parametric, each returns list of body Breps)
# ============================================================

def _union(bodies):
    if len(bodies) <= 1:
        return bodies
    try:
        un = rg.Brep.CreateBooleanUnion(bodies, sc.doc.ModelAbsoluteTolerance)
        if un and len(un) > 0:
            # Merge coplanar faces on each resulting brep
            result = []
            for b in un:
                try: b.MergeCoplanarFaces(sc.doc.ModelAbsoluteTolerance)
                except: pass
                result.append(b)
            return result
    except:
        pass
    return bodies


# --- Smooth / Lofted ---
def t_slim_slab(d):
    """Slim slab with 1-2 setbacks at random Z positions."""
    w = d.get("w", 24); h = d.get("h", 12)
    n_setbacks = d.get("n_setbacks", 1)  # 1 or 2
    sb1_z = d.get("sb1_z", 75); sb1_shrink = d.get("sb1_shrink", 0.85)
    sb2_z = d.get("sb2_z", 105); sb2_shrink = d.get("sb2_shrink", 0.7)
    bodies = []
    bodies.append(rg.Extrusion.Create(rect_curve(w, h), sb1_z, True).ToBrep(False))
    w1 = w * sb1_shrink; h1 = h * sb1_shrink
    if n_setbacks == 1:
        c2 = rect_curve(w1, h1); c2.Transform(rg.Transform.Translation(0, 0, sb1_z - 0.4))
        bodies.append(rg.Extrusion.Create(c2, TOTAL_H - sb1_z + 0.4, True).ToBrep(False))
    else:
        if sb2_z <= sb1_z + 5: sb2_z = sb1_z + 15
        c2 = rect_curve(w1, h1); c2.Transform(rg.Transform.Translation(0, 0, sb1_z - 0.4))
        bodies.append(rg.Extrusion.Create(c2, sb2_z - sb1_z + 0.4, True).ToBrep(False))
        w2 = w * sb2_shrink; h2 = h * sb2_shrink
        c3 = rect_curve(w2, h2); c3.Transform(rg.Transform.Translation(0, 0, sb2_z - 0.4))
        bodies.append(rg.Extrusion.Create(c3, TOTAL_H - sb2_z + 0.4, True).ToBrep(False))
    return _union(bodies)


def t_twisted_square(d):
    size = d.get("size", 18); twist_deg = d.get("twist", 60); taper = d.get("taper", 0.15)
    sections = []
    for i in range(21):
        t = i / 20.0; z = t * TOTAL_H
        scale = 1.0 - taper * t
        rot = t * math.radians(twist_deg)
        c = square_curve(size * scale, rot=rot)
        c.Transform(rg.Transform.Translation(0, 0, z))
        sections.append(c)
    loft = rg.Brep.CreateFromLoft(sections, rg.Point3d.Unset, rg.Point3d.Unset, rg.LoftType.Normal, False)
    if not loft or len(loft) == 0: return []
    return [loft[0].CapPlanarHoles(0.001) or loft[0]]


def t_extreme_twist(d):
    w = d.get("w", 22); h = d.get("h", 8); twist_deg = d.get("twist", 90); taper = d.get("taper", 0.10)
    sections = []
    for i in range(21):
        t = i / 20.0; z = t * TOTAL_H
        scale = 1.0 - taper * t
        rot = t * math.radians(twist_deg)
        c = rect_curve(w * scale, h * scale, rot=rot)
        c.Transform(rg.Transform.Translation(0, 0, z))
        sections.append(c)
    loft = rg.Brep.CreateFromLoft(sections, rg.Point3d.Unset, rg.Point3d.Unset, rg.LoftType.Normal, False)
    if not loft or len(loft) == 0: return []
    return [loft[0].CapPlanarHoles(0.001) or loft[0]]


def t_curved_slab(d):
    """Rectangle with one long face bowed outward toward SOUTH (-Y). CCW closed polyline."""
    w = d.get("w", 22); h = d.get("h", 12); bow = d.get("bow", 4); taper = d.get("taper", 0.10)
    # Arc from BL (-w/2, -h/2) to BR (w/2, -h/2), bowing south (-Y)
    arc_pts = []
    for k in range(15):
        xt = -w/2 + (w * k / 14.0)
        yt = -h/2 - bow * math.sin(math.pi * k / 14.0)
        arc_pts.append(rg.Point3d(xt, yt, 0))
    # CCW: arc(BL→BR south-bowed) → TR → TL → close
    pts = arc_pts + [rg.Point3d(w/2, h/2, 0), rg.Point3d(-w/2, h/2, 0), arc_pts[0]]
    base_c = rg.PolylineCurve(pts)
    sections = []
    for i in range(11):
        t = i / 10.0; z = t * TOTAL_H
        scale = 1.0 - taper * t
        c = base_c.DuplicateCurve()
        c.Transform(rg.Transform.Scale(rg.Plane.WorldXY, scale, scale, 1.0))
        c.Transform(rg.Transform.Translation(0, 0, z))
        sections.append(c)
    loft = rg.Brep.CreateFromLoft(sections, rg.Point3d.Unset, rg.Point3d.Unset, rg.LoftType.Normal, False)
    if not loft or len(loft) == 0: return []
    return [loft[0].CapPlanarHoles(0.001) or loft[0]]


def t_hourglass(d):
    base = d.get("base", 22); waist = d.get("waist", 12); waist_z = d.get("waist_z", 60)
    sizes = [base, (base+waist)/2, waist, (base+waist)/2, base]
    zs = [0, waist_z/2, waist_z, (waist_z + TOTAL_H)/2, TOTAL_H]
    sections = []
    for s, z in zip(sizes, zs):
        c = square_curve(s)
        c.Transform(rg.Transform.Translation(0, 0, z))
        sections.append(c)
    loft = rg.Brep.CreateFromLoft(sections, rg.Point3d.Unset, rg.Point3d.Unset, rg.LoftType.Normal, False)
    if not loft or len(loft) == 0: return []
    return [loft[0].CapPlanarHoles(0.001) or loft[0]]


# --- Stepped / Stacked ---
def t_wedding_cake(d):
    s1 = d.get("s1", 22); s2 = d.get("s2", 16); s3 = d.get("s3", 12)
    z1 = d.get("z1", 36); z2 = d.get("z2", 90)
    b1 = rg.Extrusion.Create(square_curve(s1), z1, True).ToBrep(False)
    c2 = square_curve(s2); c2.Transform(rg.Transform.Translation(0, 0, z1 - 0.4))
    b2 = rg.Extrusion.Create(c2, z2 - z1 + 0.4, True).ToBrep(False)
    c3 = square_curve(s3); c3.Transform(rg.Transform.Translation(0, 0, z2 - 0.4))
    b3 = rg.Extrusion.Create(c3, TOTAL_H - z2 + 0.4, True).ToBrep(False)
    return _union([b1, b2, b3])


def t_inverted_step(d):
    s1 = d.get("s1", 16); s2 = d.get("s2", 19); s3 = d.get("s3", 22)
    z1 = d.get("z1", 36); z2 = d.get("z2", 90)
    b1 = rg.Extrusion.Create(square_curve(s1), z1, True).ToBrep(False)
    c2 = square_curve(s2); c2.Transform(rg.Transform.Translation(0, 0, z1 - 0.4))
    b2 = rg.Extrusion.Create(c2, z2 - z1 + 0.4, True).ToBrep(False)
    c3 = square_curve(s3); c3.Transform(rg.Transform.Translation(0, 0, z2 - 0.4))
    b3 = rg.Extrusion.Create(c3, TOTAL_H - z2 + 0.4, True).ToBrep(False)
    return _union([b1, b2, b3])


def t_stepped_helix(d):
    """Rotation-based stack — variable box sizes & heights (sum=120m), no XY offset."""
    n = d.get("n", 4)
    # Heights summing to TOTAL_H
    h_seeds = [d.get("h{}".format(i+1), 30) for i in range(n)]
    h_total = sum(h_seeds)
    if h_total <= 0: return []
    heights = [h * TOTAL_H / h_total for h in h_seeds]
    sizes = [d.get("s{}".format(i+1), 20 - i*3) for i in range(n)]
    rot_step = d.get("rot_step", 30)
    bodies = []
    z = 0
    for i in range(n):
        c = square_curve(sizes[i], rot=math.radians(i * rot_step))
        c.Transform(rg.Transform.Translation(0, 0, z - (0.4 if i > 0 else 0)))
        ext = rg.Extrusion.Create(c, heights[i] + (0.4 if i > 0 else 0), True)
        if ext: bodies.append(ext.ToBrep(False))
        z += heights[i]
    return _union(bodies)


def t_stacked_cubes(d):
    """XY offset stack — variable sizes & heights (sum=120m), no rotation. Boxes overlap with neighbor in plan."""
    n = d.get("n", 3)
    h_seeds = [d.get("h{}".format(i+1), 40) for i in range(n)]
    h_total = sum(h_seeds)
    if h_total <= 0: return []
    heights = [h * TOTAL_H / h_total for h in h_seeds]
    sizes = [d.get("s{}".format(i+1), 18) for i in range(n)]
    bodies = []
    z = 0
    prev_ox = 0; prev_oy = 0
    for i in range(n):
        # Offset: small random shift but bounded so cube still overlaps with previous in plan
        max_off = sizes[i] * 0.20
        ox = d.get("ox{}".format(i+1), 0)
        oy = d.get("oy{}".format(i+1), 0)
        # Clamp offset
        ox = max(-max_off, min(max_off, ox))
        oy = max(-max_off, min(max_off, oy))
        prev_ox += ox; prev_oy += oy  # cumulative offset
        c = square_curve(sizes[i])
        c.Transform(rg.Transform.Translation(prev_ox, prev_oy, z - (0.4 if i > 0 else 0)))
        ext = rg.Extrusion.Create(c, heights[i] + (0.4 if i > 0 else 0), True)
        if ext: bodies.append(ext.ToBrep(False))
        z += heights[i]
    return _union(bodies)


def t_rotated_stack(d):
    """Stacked blocks rotated + Y-offset for interlocking effect."""
    sizes = d.get("sizes", [18, 16, 14, 12])
    rots_deg = d.get("rots", [0, 45, 90, 135])
    max_offset = d.get("max_offset", 3)
    n = len(sizes); h = TOTAL_H / n
    bodies = []
    for i, (s, r) in enumerate(zip(sizes, rots_deg)):
        # Each block offset in Y direction alternately for interlocking
        oy = max_offset * (1 if i % 2 == 0 else -1) if max_offset > 0 else 0
        c = square_curve(s, rot=math.radians(r))
        c.Transform(rg.Transform.Translation(0, oy, i*h - (0.4 if i > 0 else 0)))
        ext = rg.Extrusion.Create(c, h + (0.4 if i > 0 else 0), True)
        if ext: bodies.append(ext.ToBrep(False))
    return _union(bodies)


def t_pinwheel(d):
    s = d.get("s", 22)  # overall footprint size
    split_x = d.get("split_x", 0.5)  # x-divider position as ratio of s
    split_y = d.get("split_y", 0.5)  # y-divider position as ratio of s
    floors = [d.get("f1", 32), d.get("f2", 24), d.get("f3", 18), d.get("f4", 12)]
    max_q = d.get("max_quadrant", 0) % 4
    floors[max_q] = N_FLOORS  # pin one corner to full height
    heights = [f * FLOOR_H for f in floors]
    # Footprint spans [-s/2, s/2]; divider cross at (dx, dy)
    dx = split_x * s - s/2
    dy = split_y * s - s/2
    def _quad(x0, y0, x1, y1):
        return rect_curve(x1 - x0, y1 - y0, (x0 + x1) / 2, (y0 + y1) / 2)
    quads = [
        _quad(-s/2, -s/2, dx, dy),    # SW
        _quad(dx,   -s/2, s/2, dy),   # SE
        _quad(dx,   dy,   s/2, s/2),  # NE
        _quad(-s/2, dy,   dx, s/2),   # NW
    ]
    bodies = []
    for c, hh in zip(quads, heights):
        ext = rg.Extrusion.Create(c, hh, True)
        if ext: bodies.append(ext.ToBrep(False))
    return bodies


def t_splayed_base(d):
    """Splayed base + slim tower as single loft (avoids boolean union edge cases)."""
    base_w = d.get("base_w", 26); base_h = d.get("base_h", 18)
    top_w = d.get("top_w", 18); top_h = d.get("top_h", 18)
    base_z = d.get("base_z", 36)
    sections = []
    sections.append(rect_curve(base_w, base_h))
    c_mid = rect_curve(top_w, top_h); c_mid.Transform(rg.Transform.Translation(0, 0, base_z))
    sections.append(c_mid)
    c_top = rect_curve(top_w, top_h); c_top.Transform(rg.Transform.Translation(0, 0, TOTAL_H))
    sections.append(c_top)
    loft = rg.Brep.CreateFromLoft(sections, rg.Point3d.Unset, rg.Point3d.Unset, rg.LoftType.Normal, False)
    if not loft or len(loft) == 0: return []
    return [loft[0].CapPlanarHoles(0.001) or loft[0]]


# --- Carved / Void ---
def t_atrium(d):
    w = d.get("w", 22); h = d.get("h", 16); void_size = d.get("void", 7)
    void_z = d.get("void_z", 24)
    body = rg.Extrusion.Create(rect_curve(w, h), TOTAL_H, True).ToBrep(False)
    # Void extrusion at origin first, then translate brep up to void_z (extends past TOTAL_H for through-top)
    void_h = TOTAL_H - void_z + 5
    vc = rect_curve(void_size, void_size)  # at z=0
    ve = rg.Extrusion.Create(vc, void_h, True)
    if ve is None: return [body]
    vb = ve.ToBrep(False)
    vb.Translate(0, 0, void_z)
    try:
        diff = rg.Brep.CreateBooleanDifference(body, vb, sc.doc.ModelAbsoluteTolerance)
        if diff and len(diff) > 0:
            r = diff[0]
            try: r.MergeCoplanarFaces(sc.doc.ModelAbsoluteTolerance)
            except: pass
            return [r]
    except: pass
    return [body]


def t_notched_mid(d):
    w = d.get("w", 22); h = d.get("h", 16)
    notch_w = d.get("notch_w", 12); notch_d = d.get("notch_d", 6)
    z = d.get("z", 36); nh = d.get("nh", 48)
    body = rg.Extrusion.Create(rect_curve(w, h), TOTAL_H, True).ToBrep(False)
    nc = rect_curve(notch_w, notch_d * 2 + 4); nc.Transform(rg.Transform.Translation(0, h/2 - notch_d + 1, z))
    nb = rg.Extrusion.Create(nc, nh, True).ToBrep(False)
    try:
        diff = rg.Brep.CreateBooleanDifference(body, nb, sc.doc.ModelAbsoluteTolerance)
        if diff and len(diff) > 0:
            r = diff[0]
            try: r.MergeCoplanarFaces(sc.doc.ModelAbsoluteTolerance)
            except: pass
            return [r]
    except: pass
    return [body]


def t_vertical_slot(d):
    w = d.get("w", 22); h = d.get("h", 16)
    slot_w = d.get("slot_w", 4); slot_d = d.get("slot_d", 10)
    z_start = d.get("z_start", 36)
    body = rg.Extrusion.Create(rect_curve(w, h), TOTAL_H, True).ToBrep(False)
    sc_ = rect_curve(slot_w, slot_d * 2); sc_.Transform(rg.Transform.Translation(0, h/2 - slot_d/2 + 2, z_start))
    sb = rg.Extrusion.Create(sc_, TOTAL_H - z_start, True).ToBrep(False)
    try:
        diff = rg.Brep.CreateBooleanDifference(body, sb, sc.doc.ModelAbsoluteTolerance)
        if diff and len(diff) > 0:
            r = diff[0]
            try: r.MergeCoplanarFaces(sc.doc.ModelAbsoluteTolerance)
            except: pass
            return [r]
    except: pass
    return [body]


def t_sliced_top(d):
    """Diagonal cut anchored at TOP edge — z=TOTAL_H elevation preserved on cut-direction edge."""
    w = d.get("w", 22); h = d.get("h", 16); angle_deg = d.get("angle", 30)
    slice_dir = d.get("slice_dir", 0)
    body = rg.Extrusion.Create(rect_curve(w, h), TOTAL_H, True).ToBrep(False)
    # Anchor pivot at TOP edge in slice_dir direction
    edge_x = (w/2) * math.cos(math.radians(slice_dir))
    edge_y = (h/2) * math.sin(math.radians(slice_dir))
    pivot = rg.Point3d(edge_x, edge_y, TOTAL_H)
    # Half-space cutter: large box above z=TOTAL_H
    half_size = max(w, h) * 5
    half_thick = TOTAL_H * 3
    hc = rect_curve(half_size, half_size)
    he = rg.Extrusion.Create(hc, half_thick, True)
    cut_b = he.ToBrep(False)
    cut_b.Translate(0, 0, TOTAL_H + 0.5)
    # Rotate around horizontal axis perpendicular to slice_dir, anchored at top edge
    axis = rg.Vector3d(-math.sin(math.radians(slice_dir)), math.cos(math.radians(slice_dir)), 0)
    cut_b.Transform(rg.Transform.Rotation(-math.radians(angle_deg), axis, pivot))
    try:
        diff = rg.Brep.CreateBooleanDifference(body, cut_b, sc.doc.ModelAbsoluteTolerance)
        if diff and len(diff) > 0:
            r = diff[0]
            try: r.MergeCoplanarFaces(sc.doc.ModelAbsoluteTolerance)
            except: pass
            return [r]
    except: pass
    return [body]


# --- Composite / Connected ---
def t_twin_tower(d):
    """Two separate towers — may have Y offset (staggered) and pair rotation (not always XY-aligned)."""
    size = d.get("size", 12); spacing = d.get("spacing", 28)
    y_offset = d.get("y_offset", 0)
    pair_rot = d.get("pair_rot", 0)  # degrees
    c1 = square_curve(size); c1.Transform(rg.Transform.Translation(-spacing/2, y_offset, 0))
    c2 = square_curve(size); c2.Transform(rg.Transform.Translation(spacing/2, -y_offset, 0))
    if pair_rot != 0:
        rot = rg.Transform.Rotation(math.radians(pair_rot), rg.Vector3d.ZAxis, rg.Point3d.Origin)
        c1.Transform(rot); c2.Transform(rot)
    b1 = rg.Extrusion.Create(c1, TOTAL_H, True).ToBrep(False)
    b2 = rg.Extrusion.Create(c2, TOTAL_H, True).ToBrep(False)
    return [b1, b2]


def t_asym_twin(d):
    w1 = d.get("w1", 16); h1 = d.get("h1", 10)
    w2 = d.get("w2", 12); h2 = d.get("h2", 10)
    spacing = d.get("spacing", 22)
    height1 = d.get("height1", 120); height2 = d.get("height2", 84)
    c1 = rect_curve(w1, h1); c1.Transform(rg.Transform.Translation(-spacing/2, 0, 0))
    c2 = rect_curve(w2, h2); c2.Transform(rg.Transform.Translation(spacing/2, 0, 0))
    b1 = rg.Extrusion.Create(c1, height1, True).ToBrep(False)
    b2 = rg.Extrusion.Create(c2, height2, True).ToBrep(False)
    return [b1, b2]


def t_canti_bridge(d):
    """Two straight tower prisms connected by bridge in the gap between them."""
    size = d.get("size", 10); spacing = d.get("spacing", 28)
    bridge_h = d.get("bridge_h", 18); bridge_z = d.get("bridge_z", TOTAL_H - bridge_h)
    if bridge_z + bridge_h > TOTAL_H: bridge_z = TOTAL_H - bridge_h
    if bridge_z < 0: bridge_z = 0
    # Towers: straight prisms (no lean — cleaner topology for boolean union)
    t1c = square_curve(size); t1c.Transform(rg.Transform.Translation(-spacing/2, 0, 0))
    t2c = square_curve(size); t2c.Transform(rg.Transform.Translation(spacing/2, 0, 0))
    b1 = rg.Extrusion.Create(t1c, TOTAL_H, True).ToBrep(False)
    b2 = rg.Extrusion.Create(t2c, TOTAL_H, True).ToBrep(False)
    # Bridge spans gap, +1.5m into each tower for clean union
    gap = spacing - size
    bw = gap + 3
    bc = rect_curve(bw, size); bc.Transform(rg.Transform.Translation(0, 0, bridge_z))
    bb = rg.Extrusion.Create(bc, bridge_h, True).ToBrep(False)
    bodies = [b for b in [b1, b2, bb] if b is not None]
    try:
        un = rg.Brep.CreateBooleanUnion(bodies, sc.doc.ModelAbsoluteTolerance)
        if un and len(un) == 1:
            r = un[0]
            try: r.MergeCoplanarFaces(sc.doc.ModelAbsoluteTolerance)
            except: pass
            return [r]
        elif un and len(un) > 1:
            # merge each
            out = []
            for r in un:
                try: r.MergeCoplanarFaces(sc.doc.ModelAbsoluteTolerance)
                except: pass
                out.append(r)
            return out
    except: pass
    return bodies


def t_mega_cantilever(d):
    base_size = d.get("base_size", 16); canti_w = d.get("canti_w", 36); canti_d = d.get("canti_d", 16)
    base_z = d.get("base_z", 81)
    b1 = rg.Extrusion.Create(square_curve(base_size), base_z, True).ToBrep(False)
    cc = rect_curve(canti_w, canti_d); cc.Transform(rg.Transform.Translation(0, 0, base_z - 0.4))
    b2 = rg.Extrusion.Create(cc, TOTAL_H - base_z + 0.4, True).ToBrep(False)
    return _union([b1, b2])


def t_folded_plate(d):
    L = d.get("L", 18); W = d.get("W", 6); fold_deg = d.get("fold", 60)
    c1 = rect_curve(L, W, ox=L/2); c1.Transform(rg.Transform.Rotation(math.radians(fold_deg/2), rg.Vector3d.ZAxis, rg.Point3d.Origin))
    c2 = rect_curve(L, W, ox=L/2); c2.Transform(rg.Transform.Rotation(math.radians(-fold_deg/2), rg.Vector3d.ZAxis, rg.Point3d.Origin))
    b1 = rg.Extrusion.Create(c1, TOTAL_H, True).ToBrep(False)
    b2 = rg.Extrusion.Create(c2, TOTAL_H, True).ToBrep(False)
    return _union([b1, b2])


# --- Single-mass ---
def t_prism(d):
    """Straight extrusion with variable shape, aspect, rotation, optional corner chamfer."""
    shape = d.get("shape", "square")
    size = d.get("size", 18)
    aspect = d.get("aspect", 1.0)  # w/h
    rot_deg = d.get("rot", 0)
    chamfer = d.get("chamfer", 0)  # corner cut size, 0 = no chamfer
    if shape == "triangle":
        c = triangle_curve(size)
    else:
        w = size * aspect; h = size
        if chamfer > 0:
            # rect with 4 chamfered corners — octagon-like
            ch = chamfer
            coords = [(-w/2+ch,-h/2),(w/2-ch,-h/2),(w/2,-h/2+ch),(w/2,h/2-ch),(w/2-ch,h/2),(-w/2+ch,h/2),(-w/2,h/2-ch),(-w/2,-h/2+ch),(-w/2+ch,-h/2)]
            c = rg.PolylineCurve([rg.Point3d(x,y,0) for x,y in coords])
        else:
            c = rect_curve(w, h)
    if rot_deg != 0:
        c.Transform(rg.Transform.Rotation(math.radians(rot_deg), rg.Vector3d.ZAxis, rg.Point3d.Origin))
    ext = rg.Extrusion.Create(c, TOTAL_H, True)
    return [ext.ToBrep(False)] if ext else []


def t_chamfered_prism(d):
    """Prism with chamfered corners — distinctive octagonal-rect plan."""
    w = d.get("w", 22); h = d.get("h", 16); ch = d.get("ch", 4)
    coords = [(-w/2+ch,-h/2),(w/2-ch,-h/2),(w/2,-h/2+ch),(w/2,h/2-ch),(w/2-ch,h/2),(-w/2+ch,h/2),(-w/2,h/2-ch),(-w/2,-h/2+ch),(-w/2+ch,-h/2)]
    c = rg.PolylineCurve([rg.Point3d(x,y,0) for x,y in coords])
    ext = rg.Extrusion.Create(c, TOTAL_H, True)
    return [ext.ToBrep(False)] if ext else []


def t_pyramid_top(d):
    """Rectangle base + pyramidal top crown — single loft, no separation."""
    w = d.get("w", 20); h = d.get("h", 14); body_z = d.get("body_z", 90)
    # Single loft: base, top of straight body, then pyramid sections
    sections = []
    # Bottom of building
    sections.append(rect_curve(w, h))
    # Top of straight body (same size)
    c_top_body = rect_curve(w, h); c_top_body.Transform(rg.Transform.Translation(0, 0, body_z))
    sections.append(c_top_body)
    # Pyramid sections from body_z up to TOTAL_H
    pyramid_h = TOTAL_H - body_z
    for i in range(1, 5):
        t = i / 4.0
        scale = 1.0 - 0.85 * t  # shrink to 15% at top
        c = rect_curve(w * scale, h * scale)
        c.Transform(rg.Transform.Translation(0, 0, body_z + t * pyramid_h))
        sections.append(c)
    loft = rg.Brep.CreateFromLoft(sections, rg.Point3d.Unset, rg.Point3d.Unset, rg.LoftType.Normal, False)
    if not loft or len(loft) == 0: return []
    return [loft[0].CapPlanarHoles(0.001) or loft[0]]


def t_pencil_tower(d):
    """Extreme slim ratio tower — NYC pencil style, 5-7m wide ~120m tall."""
    w = d.get("w", 6); h = d.get("h", 9)
    rot_deg = d.get("rot", 0)
    c = rect_curve(w, h)
    if rot_deg != 0:
        c.Transform(rg.Transform.Rotation(math.radians(rot_deg), rg.Vector3d.ZAxis, rg.Point3d.Origin))
    ext = rg.Extrusion.Create(c, TOTAL_H, True)
    return [ext.ToBrep(False)] if ext else []


def t_catalyst_lean(d):
    """Capital Gate-style — whole tower at dramatic 8-12° lean angle, slight twist."""
    w = d.get("w", 20); h = d.get("h", 14)
    lean = d.get("lean", 18); twist = d.get("twist", 20); dir_deg = d.get("dir", 0)
    ox_unit = math.cos(math.radians(dir_deg)); oy_unit = math.sin(math.radians(dir_deg))
    sections = []
    for i in range(13):
        t = i / 12.0; z = t * TOTAL_H
        c = rect_curve(w, h)
        c.Transform(rg.Transform.Rotation(t * math.radians(twist), rg.Vector3d.ZAxis, rg.Point3d.Origin))
        c.Transform(rg.Transform.Translation(lean * t * ox_unit, lean * t * oy_unit, z))
        sections.append(c)
    loft = rg.Brep.CreateFromLoft(sections, rg.Point3d.Unset, rg.Point3d.Unset, rg.LoftType.Normal, False)
    if not loft or len(loft) == 0: return []
    return [loft[0].CapPlanarHoles(0.001) or loft[0]]


def t_gherkin(d):
    """30 St Mary Axe style — narrow at base, wider in middle, taper to top, slight twist."""
    base = d.get("base", 14); waist = d.get("waist", 22); top = d.get("top", 10)
    twist = d.get("twist", 30)
    sizes = [base, (base+waist)/2, waist, (waist+top)/2, top]
    zs = [0, 30, 60, 90, TOTAL_H]
    sections = []
    for s, z in zip(sizes, zs):
        c = square_curve(s)
        t_norm = z / TOTAL_H
        c.Transform(rg.Transform.Rotation(t_norm * math.radians(twist), rg.Vector3d.ZAxis, rg.Point3d.Origin))
        c.Transform(rg.Transform.Translation(0, 0, z))
        sections.append(c)
    loft = rg.Brep.CreateFromLoft(sections, rg.Point3d.Unset, rg.Point3d.Unset, rg.LoftType.Normal, False)
    if not loft or len(loft) == 0: return []
    return [loft[0].CapPlanarHoles(0.001) or loft[0]]


def t_sail_curve(d):
    """Single dramatic parabolic curve — sail bowed south (-Y), max bow at middle height."""
    w = d.get("w", 22); h = d.get("h", 14); bow = d.get("bow", 12)
    sections = []
    for i in range(13):
        t = i / 12.0; z = t * TOTAL_H
        local_bow = bow * math.sin(t * math.pi)
        # Arc bowing SOUTH (-Y) at south face
        arc_pts = []
        for k in range(15):
            xt = -w/2 + (w * k / 14.0)
            yt = -h/2 - local_bow * math.sin(math.pi * k / 14.0)
            arc_pts.append(rg.Point3d(xt, yt, 0))
        pts = arc_pts + [rg.Point3d(w/2, h/2, 0), rg.Point3d(-w/2, h/2, 0), arc_pts[0]]
        c = rg.PolylineCurve(pts)
        c.Transform(rg.Transform.Translation(0, 0, z))
        sections.append(c)
    loft = rg.Brep.CreateFromLoft(sections, rg.Point3d.Unset, rg.Point3d.Unset, rg.LoftType.Normal, False)
    if not loft or len(loft) == 0: return []
    return [loft[0].CapPlanarHoles(0.001) or loft[0]]


def t_crystalline(d):
    """Faceted crystalline form — sharp pinnacle top, diamond-cut base."""
    base = d.get("base", 22); top = d.get("top", 4); waist_factor = d.get("waist", 0.85)
    sections = []
    zs = [0, 0.3, 0.7, 1.0]
    sizes = [base, base * waist_factor, base * 0.5, top]
    rotations = [0, 22.5, 45, 90]
    for s, z_norm, rot in zip(sizes, zs, rotations):
        z = z_norm * TOTAL_H
        c = square_curve(s)
        c.Transform(rg.Transform.Rotation(math.radians(rot), rg.Vector3d.ZAxis, rg.Point3d.Origin))
        c.Transform(rg.Transform.Translation(0, 0, z))
        sections.append(c)
    loft = rg.Brep.CreateFromLoft(sections, rg.Point3d.Unset, rg.Point3d.Unset, rg.LoftType.Straight, False)
    if not loft or len(loft) == 0: return []
    return [loft[0].CapPlanarHoles(0.001) or loft[0]]


def t_plane_carved(d):
    """Edge-anchored plane cuts. Upper: pivots at top edge (top face preserved on cut side). Lower: pivots at bottom edge (base preserved on cut side)."""
    w = d.get("w", 22); h = d.get("h", 18)
    n_cuts = d.get("n_cuts", 1)
    body = rg.Extrusion.Create(rect_curve(w, h), TOTAL_H, True).ToBrep(False)
    for i in range(n_cuts):
        cut_angle = d.get("cut_angle_{}".format(i+1), 30)
        cut_dir_deg = d.get("cut_dir_{}".format(i+1), i * 90)
        cut_side = d.get("cut_side_{}".format(i+1), 0)
        edge_x = (w/2) * math.cos(math.radians(cut_dir_deg))
        edge_y = (h/2) * math.sin(math.radians(cut_dir_deg))
        half_size = max(w, h) * 5
        half_thick = TOTAL_H * 3
        hc = rg.PolylineCurve([rg.Point3d(-half_size/2,-half_size/2,0),rg.Point3d(half_size/2,-half_size/2,0),rg.Point3d(half_size/2,half_size/2,0),rg.Point3d(-half_size/2,half_size/2,0),rg.Point3d(-half_size/2,-half_size/2,0)])
        he = rg.Extrusion.Create(hc, half_thick, True)
        if not he: continue
        hb = he.ToBrep(False)
        if cut_side == 0:
            pivot = rg.Point3d(edge_x, edge_y, TOTAL_H)
            hb.Translate(0, 0, TOTAL_H + 0.5)
            rot_sign = -1
        else:
            pivot = rg.Point3d(edge_x, edge_y, 0)
            hb.Translate(0, 0, -half_thick - 0.5)
            rot_sign = 1
        axis = rg.Vector3d(-math.sin(math.radians(cut_dir_deg)), math.cos(math.radians(cut_dir_deg)), 0)
        hb.Transform(rg.Transform.Rotation(rot_sign * math.radians(cut_angle), axis, pivot))
        try:
            diff = rg.Brep.CreateBooleanDifference(body, hb, sc.doc.ModelAbsoluteTolerance)
            if diff and len(diff) > 0:
                grounded = [b for b in diff if b.GetBoundingBox(True).Min.Z <= 1.0]
                if grounded:
                    largest = max(grounded, key=lambda b: b.GetVolume() if b.IsSolid else 0)
                    body = largest
                    try: body.MergeCoplanarFaces(sc.doc.ModelAbsoluteTolerance)
                    except: pass
        except: pass
    return [body]


def t_morph_form(d):
    """Loft from rect (one aspect) at bottom to different aspect at top, with rotation — slab-to-tower morph."""
    w_bot = d.get("w_bot", 28); h_bot = d.get("h_bot", 10)
    w_top = d.get("w_top", 14); h_top = d.get("h_top", 14)
    twist = d.get("twist", 45)
    sections = []
    for i in range(13):
        t = i / 12.0; z = t * TOTAL_H
        w = w_bot + (w_top - w_bot) * t
        h = h_bot + (h_top - h_bot) * t
        c = rect_curve(w, h)
        c.Transform(rg.Transform.Rotation(t * math.radians(twist), rg.Vector3d.ZAxis, rg.Point3d.Origin))
        c.Transform(rg.Transform.Translation(0, 0, z))
        sections.append(c)
    loft = rg.Brep.CreateFromLoft(sections, rg.Point3d.Unset, rg.Point3d.Unset, rg.LoftType.Normal, False)
    if not loft or len(loft) == 0: return []
    return [loft[0].CapPlanarHoles(0.001) or loft[0]]


def t_diagonal_lean(d):
    """Whole tower leaning diagonally (subtle, all sections shifted in fixed direction)."""
    w = d.get("w", 18); h = d.get("h", 18); lean = d.get("lean", 7); dir_deg = d.get("dir", 45)
    sections = []
    ox_unit = math.cos(math.radians(dir_deg)); oy_unit = math.sin(math.radians(dir_deg))
    for i in range(11):
        t = i / 10.0; z = t * TOTAL_H
        c = rect_curve(w, h)
        c.Transform(rg.Transform.Translation(lean * t * ox_unit, lean * t * oy_unit, z))
        sections.append(c)
    loft = rg.Brep.CreateFromLoft(sections, rg.Point3d.Unset, rg.Point3d.Unset, rg.LoftType.Normal, False)
    if not loft or len(loft) == 0: return []
    return [loft[0].CapPlanarHoles(0.001) or loft[0]]


def t_cross_plan(d):
    """Cross/plus plan with twist, taper, and sweep along arc path."""
    s = d.get("s", 11); t = d.get("t", 4)
    twist_deg = d.get("twist", 0)
    taper = d.get("taper", 0.0)
    sweep_lean = d.get("sweep_lean", 0)
    sweep_dir = d.get("sweep_dir", 0)
    coords = [(-t,-s),(t,-s),(t,-t),(s,-t),(s,t),(t,t),(t,s),(-t,s),(-t,t),(-s,t),(-s,-t),(-t,-t),(-t,-s)]
    sections = []
    for i in range(13):
        norm_t = i / 12.0; z = norm_t * TOTAL_H
        scale = 1.0 - taper * norm_t
        # Cross at this scale
        c = rg.PolylineCurve([rg.Point3d(x*scale, y*scale, 0) for x, y in coords])
        if twist_deg != 0:
            c.Transform(rg.Transform.Rotation(norm_t * math.radians(twist_deg), rg.Vector3d.ZAxis, rg.Point3d.Origin))
        # Sweep lean: arc path
        if sweep_lean != 0:
            lean_t = math.sin(norm_t * math.pi) * sweep_lean  # max in middle
            ox = lean_t * math.cos(math.radians(sweep_dir))
            oy = lean_t * math.sin(math.radians(sweep_dir))
        else:
            ox, oy = 0, 0
        c.Transform(rg.Transform.Translation(ox, oy, z))
        sections.append(c)
    loft = rg.Brep.CreateFromLoft(sections, rg.Point3d.Unset, rg.Point3d.Unset, rg.LoftType.Normal, False)
    if not loft or len(loft) == 0: return []
    return [loft[0].CapPlanarHoles(0.001) or loft[0]]


def t_t_crown(d):
    """Body + crown box on top. Body can be square/rectangle, crown can be rotated/offset."""
    body_w = d.get("body_w", 14); body_h = d.get("body_h", 14)
    crown_w = d.get("crown_w", 26); crown_d = d.get("crown_d", 10)
    crown_rot = d.get("crown_rot", 90)  # degrees, relative to body
    crown_ox = d.get("crown_ox", 0); crown_oy = d.get("crown_oy", 0)
    body_z = d.get("body_z", 100)
    b1 = rg.Extrusion.Create(rect_curve(body_w, body_h), body_z, True).ToBrep(False)
    cc = rect_curve(crown_w, crown_d)
    if crown_rot != 0:
        cc.Transform(rg.Transform.Rotation(math.radians(crown_rot), rg.Vector3d.ZAxis, rg.Point3d.Origin))
    cc.Transform(rg.Transform.Translation(crown_ox, crown_oy, body_z - 0.4))
    b2 = rg.Extrusion.Create(cc, TOTAL_H - body_z + 0.4, True).ToBrep(False)
    return _union([b1, b2])


def t_plinth_tower(d):
    plinth_size = d.get("plinth_size", 28); tower_size = d.get("tower_size", 14); plinth_z = d.get("plinth_z", 12)
    pb = rg.Extrusion.Create(square_curve(plinth_size), plinth_z, True).ToBrep(False)
    tc = square_curve(tower_size); tc.Transform(rg.Transform.Translation(0, 0, plinth_z - 0.4))
    tb = rg.Extrusion.Create(tc, TOTAL_H - plinth_z + 0.4, True).ToBrep(False)
    return _union([pb, tb])


def t_beveled_top(d):
    """Single loft: base (full size) → straight up to bevel_top_z → tapered to top."""
    w = d.get("w", 22); h = d.get("h", 16); bevel_top_z = d.get("bevel_z", 102)
    bevel_h_total = TOTAL_H - bevel_top_z
    sections = []
    # Base
    sections.append(rect_curve(w, h))
    # Top of straight portion (still full size)
    c_top_straight = rect_curve(w, h)
    c_top_straight.Transform(rg.Transform.Translation(0, 0, bevel_top_z))
    sections.append(c_top_straight)
    # Bevel sections from bevel_top_z to TOTAL_H
    for i in range(1, 7):
        t = i / 6.0; scale = 1.0 - 0.5 * t
        c = rect_curve(w * scale, h * scale)
        c.Transform(rg.Transform.Translation(0, 0, bevel_top_z + t * bevel_h_total))
        sections.append(c)
    loft = rg.Brep.CreateFromLoft(sections, rg.Point3d.Unset, rg.Point3d.Unset, rg.LoftType.Normal, False)
    if not loft or len(loft) == 0: return []
    return [loft[0].CapPlanarHoles(0.001) or loft[0]]


# ============================================================
# TYPOLOGY REGISTRY
# ============================================================
TYPOLOGIES = {
    "slim_slab":        (t_slim_slab,        {"w": (20, 28), "h": (10, 14), "n_setbacks": (1, 2), "sb1_z": (60, 90), "sb1_shrink": (0.75, 0.92), "sb2_z": (95, 110), "sb2_shrink": (0.55, 0.75)}),
    "twisted_square":   (t_twisted_square,   {"size": (16, 22), "twist": (60, 180), "taper": (0.05, 0.35)}),
    "extreme_twist":    (t_extreme_twist,    {"w": (18, 26), "h": (5, 9), "twist": (90, 270), "taper": (0.0, 0.20)}),
    "curved_slab":      (t_curved_slab,      {"w": (18, 24), "h": (10, 14), "bow": (3, 6), "taper": (0.05, 0.15)}),
    "hourglass":        (t_hourglass,        {"base": (20, 28), "waist": (6, 12), "waist_z": (40, 80)}),
    "wedding_cake":     (t_wedding_cake,     {"s1": (20, 26), "s2": (14, 18), "s3": (10, 14), "z1": (30, 42), "z2": (84, 96)}),
    "inverted_step":    (t_inverted_step,    {"s1": (14, 18), "s2": (17, 21), "s3": (20, 26), "z1": (30, 42), "z2": (84, 96)}),
    "stepped_helix":    (t_stepped_helix,    {"n": (3, 5), "h1": (15, 45), "h2": (15, 45), "h3": (15, 45), "h4": (15, 45), "h5": (15, 45), "s1": (18, 26), "s2": (15, 22), "s3": (12, 18), "s4": (10, 15), "s5": (8, 12), "rot_step": (20, 60)}),
    "stacked_cubes":    (t_stacked_cubes,    {"n": (2, 4), "h1": (25, 55), "h2": (25, 55), "h3": (25, 55), "h4": (25, 55), "s1": (16, 24), "s2": (14, 22), "s3": (12, 20), "s4": (10, 18), "ox1": (0, 0), "oy1": (0, 0), "ox2": (-3, 3), "oy2": (-3, 3), "ox3": (-3, 3), "oy3": (-3, 3), "ox4": (-3, 3), "oy4": (-3, 3)}),
    "rotated_stack":    (t_rotated_stack,    {"max_offset": (0, 5)}),
    "pinwheel":         (t_pinwheel,         {"s": (18, 36), "split_x": (0.3, 0.7), "split_y": (0.3, 0.7), "f1": (12, 36), "f2": (10, 32), "f3": (8, 28), "f4": (6, 24), "max_quadrant": (0, 3)}),
    "splayed_base":     (t_splayed_base,     {"base_w": (24, 30), "base_h": (16, 20), "top_w": (16, 20), "top_h": (16, 20), "base_z": (30, 42)}),
    "atrium":           (t_atrium,           {"w": (22, 28), "h": (16, 20), "void": (8, 12), "void_z": (12, 24)}),
    "notched_mid":      (t_notched_mid,      {"w": (20, 26), "h": (14, 18), "notch_w": (10, 14), "notch_d": (5, 8), "z": (30, 42), "nh": (40, 56)}),
    "vertical_slot":    (t_vertical_slot,    {"w": (20, 26), "h": (14, 18), "slot_w": (3, 5), "slot_d": (8, 12), "z_start": (30, 45)}),
    "sliced_top":       (t_sliced_top,       {"w": (20, 26), "h": (14, 18), "angle": (35, 70), "slice_dir": (60, 120)}),
    "twin_tower":       (t_twin_tower,       {"size": (10, 14), "spacing": (24, 32), "y_offset": (-4, 4), "pair_rot": (0, 0)}),
    "asym_twin":        (t_asym_twin,        {"w1": (14, 18), "h1": (8, 12), "w2": (10, 14), "h2": (8, 12), "spacing": (20, 26), "height2": (60, 96)}),
    "canti_bridge":     (t_canti_bridge,     {"size": (8, 12), "spacing": (22, 32), "bridge_h": (12, 24), "bridge_z": (60, 96)}),
    "mega_cantilever":  (t_mega_cantilever,  {"base_size": (14, 18), "canti_w": (30, 40), "canti_d": (14, 18), "base_z": (72, 90)}),
    "folded_plate":     (t_folded_plate,     {"L": (16, 22), "W": (5, 8), "fold": (45, 75)}),
    "prism":            (t_prism,            {"size": (16, 22), "aspect": (0.6, 1.5), "rot": (0, 0), "chamfer": (0, 4)}),
    "chamfered_prism":  (t_chamfered_prism,  {"w": (18, 26), "h": (14, 20), "ch": (3, 6)}),
    "pyramid_top":      (t_pyramid_top,      {"w": (18, 24), "h": (12, 18), "body_z": (75, 96)}),
    "diagonal_lean":    (t_diagonal_lean,    {"w": (16, 22), "h": (16, 22), "lean": (5, 10), "dir": (225, 315)}),
    "pencil_tower":     (t_pencil_tower,     {"w": (5, 8), "h": (8, 12), "rot": (0, 0)}),
    "catalyst_lean":    (t_catalyst_lean,    {"w": (18, 24), "h": (14, 20), "lean": (15, 25), "twist": (10, 40), "dir": (225, 315)}),
    "gherkin":          (t_gherkin,          {"base": (12, 16), "waist": (20, 26), "top": (8, 12), "twist": (15, 60)}),
    "sail_curve":       (t_sail_curve,       {"w": (20, 26), "h": (12, 18), "bow": (8, 15)}),
    "crystalline":      (t_crystalline,      {"base": (20, 26), "top": (3, 6), "waist": (0.75, 0.95)}),
    "morph_form":       (t_morph_form,       {"w_bot": (24, 32), "h_bot": (8, 14), "w_top": (10, 16), "h_top": (10, 16), "twist": (0, 90)}),
    "cross_plan":       (t_cross_plan,       {"s": (10, 14), "t": (3, 5), "twist": (0, 90), "taper": (0.0, 0.30), "sweep_lean": (0, 8), "sweep_dir": (225, 315)}),
    "t_crown":          (t_t_crown,          {"body_w": (12, 18), "body_h": (12, 18), "crown_w": (20, 32), "crown_d": (7, 14), "crown_rot": (0, 90), "crown_ox": (-4, 4), "crown_oy": (-4, 4), "body_z": (85, 108)}),
    "plinth_tower":     (t_plinth_tower,     {"plinth_size": (24, 32), "tower_size": (12, 16), "plinth_z": (9, 15)}),
    "beveled_top":      (t_beveled_top,      {"w": (20, 26), "h": (14, 18), "bevel_z": (96, 108)}),
}


def randomize_dials(typology):
    _, dial_ranges = TYPOLOGIES[typology]
    dials = {}
    for k, v in dial_ranges.items():
        if isinstance(v, tuple) and len(v) == 2:
            lo, hi = v
            if isinstance(lo, int) and isinstance(hi, int):
                dials[k] = random.randint(lo, hi)
            else:
                dials[k] = random.uniform(lo, hi)
    return dials


# ============================================================
# WORKFLOW: fresh / lock / next
# ============================================================
def make_option(opt_num, center_pt, typology, dials, color):
    builder, _ = TYPOLOGIES[typology]
    try:
        bodies = builder(dials)
    except Exception as e:
        bodies = []
    if not bodies:
        return False
    finalize_option(opt_num, center_pt, bodies, color)
    return True


def fresh(grid_size=None):
    """Refresh all cells with random typologies. Preserves current grid size unless overridden."""
    # Determine grid size: current max if any gens exist, else 2
    gens_prev = sc.sticky.get("v11_generations", [])
    if grid_size is None:
        grid_size = gens_prev[-1]["grid_size"] if gens_prev else 2
    wipe_all()
    if not rs.IsLayer(PARENT_LAYER):
        rs.AddLayer(PARENT_LAYER)
    sc.sticky["v11_generations"] = []
    sc.sticky["v11_option_typology"] = {}
    sc.sticky["v11_option_dials"] = {}
    sc.sticky["v11_option_color"] = {}
    sc.sticky["v11_option_cell"] = {}
    sc.sticky["v11_next_opt"] = 1
    sc.sticky["v11_gen_seed"] = int(time.time()) % 1000000
    gen_seed = sc.sticky["v11_gen_seed"]
    cells = [(i, j) for j in range(grid_size) for i in range(grid_size)]
    new_options = []
    typology_names = list(TYPOLOGIES.keys())
    for slot, (i, j) in enumerate(cells):
        opt = sc.sticky["v11_next_opt"]; sc.sticky["v11_next_opt"] = opt + 1
        random.seed(opt * 137 + 7 + gen_seed * 1000)
        typology = random.choice(typology_names)
        dials = randomize_dials(typology)
        color = typology_color(typology)
        sc.sticky["v11_option_typology"][opt] = typology
        sc.sticky["v11_option_dials"][opt] = dials
        sc.sticky["v11_option_color"][opt] = color
        sc.sticky["v11_option_cell"][opt] = (i, j)
        cx = i * CELL_FT + CELL_FT / 2
        cy = j * CELL_FT + CELL_FT / 2
        make_option(opt, rg.Point3d(cx, cy, 0), typology, dials, color)
        new_options.append(opt)
    sc.sticky["v11_generations"].append({"cells": cells, "options": new_options, "parents": None, "grid_size": grid_size})
    for opt in new_options:
        cell = sc.sticky["v11_option_cell"][opt]
        add_label(opt, cell[0], cell[1])
    view = sc.doc.Views.ActiveView
    if view: view.ActiveViewport.ZoomExtents()
    sc.doc.Views.Redraw()
    return new_options


def add_generation_locked(parent_opts):
    """Lock-based: inherit typology + color from parents, vary dials."""
    gens = sc.sticky.get("v11_generations", [])
    if not gens: return None
    cur = gens[-1]["grid_size"]
    new_size = cur + 1
    new_cells = [(i, j) for j in range(new_size) for i in range(new_size) if i == cur or j == cur]
    sc.sticky["v11_gen_seed"] += 1
    gen_seed = sc.sticky["v11_gen_seed"]
    new_options = []
    for slot, (i, j) in enumerate(new_cells):
        opt = sc.sticky["v11_next_opt"]; sc.sticky["v11_next_opt"] = opt + 1
        parent = parent_opts[slot % len(parent_opts)]
        random.seed(opt * 137 + 7 + gen_seed * 1000)
        typology = sc.sticky["v11_option_typology"][parent]
        dials = randomize_dials(typology)
        color = sc.sticky["v11_option_color"][parent]
        sc.sticky["v11_option_typology"][opt] = typology
        sc.sticky["v11_option_dials"][opt] = dials
        sc.sticky["v11_option_color"][opt] = color
        sc.sticky["v11_option_cell"][opt] = (i, j)
        cx = i * CELL_FT + CELL_FT / 2
        cy = j * CELL_FT + CELL_FT / 2
        make_option(opt, rg.Point3d(cx, cy, 0), typology, dials, color)
        new_options.append(opt)
    gens.append({"cells": new_cells, "options": new_options, "parents": list(parent_opts), "grid_size": new_size, "mode": "locked"})
    for opt in new_options:
        cell = sc.sticky["v11_option_cell"][opt]
        add_label(opt, cell[0], cell[1])
    view = sc.doc.Views.ActiveView
    if view: view.ActiveViewport.ZoomExtents()
    sc.doc.Views.Redraw()
    return gens[-1]


def add_generation_random():
    """Random next: new perimeter cells get fresh random typologies, new palette colors."""
    gens = sc.sticky.get("v11_generations", [])
    if not gens: return None
    cur = gens[-1]["grid_size"]
    new_size = cur + 1
    new_cells = [(i, j) for j in range(new_size) for i in range(new_size) if i == cur or j == cur]
    sc.sticky["v11_gen_seed"] += 1
    gen_seed = sc.sticky["v11_gen_seed"]
    typology_names = list(TYPOLOGIES.keys())
    new_options = []
    for slot, (i, j) in enumerate(new_cells):
        opt = sc.sticky["v11_next_opt"]; sc.sticky["v11_next_opt"] = opt + 1
        random.seed(opt * 137 + 7 + gen_seed * 1000)
        typology = random.choice(typology_names)
        dials = randomize_dials(typology)
        color = typology_color(typology)
        sc.sticky["v11_option_typology"][opt] = typology
        sc.sticky["v11_option_dials"][opt] = dials
        sc.sticky["v11_option_color"][opt] = color
        sc.sticky["v11_option_cell"][opt] = (i, j)
        cx = i * CELL_FT + CELL_FT / 2
        cy = j * CELL_FT + CELL_FT / 2
        make_option(opt, rg.Point3d(cx, cy, 0), typology, dials, color)
        new_options.append(opt)
    gens.append({"cells": new_cells, "options": new_options, "parents": None, "grid_size": new_size, "mode": "random"})
    for opt in new_options:
        cell = sc.sticky["v11_option_cell"][opt]
        add_label(opt, cell[0], cell[1])
    view = sc.doc.Views.ActiveView
    if view: view.ActiveViewport.ZoomExtents()
    sc.doc.Views.Redraw()
    return gens[-1]


def lock_selected():
    """Lock: use Rhino selection as parents → next gen inherits their typologies."""
    sel_ids = rs.SelectedObjects()
    if not sel_ids: return None, "no selection"
    parents = []
    for sid in sel_ids:
        obj = sc.doc.Objects.Find(sid)
        if obj is None: continue
        layer = sc.doc.Layers[obj.Attributes.LayerIndex]
        m = re.search(r"Opt_(\d+)", layer.FullPath)
        if m:
            o = int(m.group(1))
            if o not in parents: parents.append(o)
    if not parents: return None, "no Opt_NN found"
    return add_generation_locked(parents), parents


def next_gen():
    """Next: no selection → random typologies for new perimeter. If selection exists, locks to those."""
    sel_ids = rs.SelectedObjects()
    if sel_ids:
        return lock_selected()
    gens = sc.sticky.get("v11_generations", [])
    if not gens: return fresh()
    return add_generation_random()


def typology_set(name, n=4):
    """Generate 4 variations of one typology in 2x2 grid."""
    if name not in TYPOLOGIES:
        return None, "unknown typology: {}".format(name)
    wipe_all()
    if not rs.IsLayer(PARENT_LAYER): rs.AddLayer(PARENT_LAYER)
    sc.sticky["v11_generations"] = []
    sc.sticky["v11_option_typology"] = {}
    sc.sticky["v11_option_dials"] = {}
    sc.sticky["v11_option_color"] = {}
    sc.sticky["v11_option_cell"] = {}
    sc.sticky["v11_next_opt"] = 1
    sc.sticky["v11_gen_seed"] = int(time.time()) % 1000000
    gen_seed = sc.sticky["v11_gen_seed"]
    cells = [(i, j) for j in range(2) for i in range(2)]
    new_options = []
    for slot, (i, j) in enumerate(cells):
        opt = sc.sticky["v11_next_opt"]; sc.sticky["v11_next_opt"] = opt + 1
        random.seed(opt * 137 + 7 + gen_seed * 1000)
        dials = randomize_dials(name)
        color = typology_color(name)
        sc.sticky["v11_option_typology"][opt] = name
        sc.sticky["v11_option_dials"][opt] = dials
        sc.sticky["v11_option_color"][opt] = color
        sc.sticky["v11_option_cell"][opt] = (i, j)
        cx = i * CELL_FT + CELL_FT / 2
        cy = j * CELL_FT + CELL_FT / 2
        make_option(opt, rg.Point3d(cx, cy, 0), name, dials, color)
        new_options.append(opt)
    sc.sticky["v11_generations"].append({"cells": cells, "options": new_options, "parents": None, "grid_size": 2})
    for opt in new_options:
        cell = sc.sticky["v11_option_cell"][opt]
        add_label(opt, cell[0], cell[1])
    view = sc.doc.Views.ActiveView
    if view: view.ActiveViewport.ZoomExtents()
    sc.doc.Views.Redraw()
    return new_options, name


# Regenerate palette sized to typology count (1 unique color per typology)
PALETTE = _generate_palette(len(TYPOLOGIES) + 2)


# ============================================================
# REGISTER IN STICKY
# ============================================================
sc.sticky["v11_loaded"] = True
sc.sticky["v11_typologies"] = TYPOLOGIES
sc.sticky["v11_palette"] = PALETTE
sc.sticky["v11_fresh"] = fresh
sc.sticky["v11_refresh"] = fresh  # alias — more semantically natural
sc.sticky["v11_lock"] = lock_selected
sc.sticky["v11_next"] = next_gen
sc.sticky["v11_typology_set"] = typology_set
sc.sticky["v11_wipe_all"] = wipe_all
sc.sticky["v11_make_option"] = make_option
sc.sticky["v11_add_label"] = add_label

print("v11 tower-massing engine loaded. {} typologies registered.".format(len(TYPOLOGIES)))
print("Commands: sc.sticky['v11_fresh']() | v11_lock | v11_next | v11_typology_set(name)")
