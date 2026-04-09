// ===== Portfolio Edit Mode v2 =====
// ?edit=1 to activate
// Features: drag, resize (transform-based, no layout shift),
//           smart alignment guides, undo/redo, parent selection

(function() {
    var params = new URLSearchParams(window.location.search);
    if (params.get('edit') !== '1') return;

    // ===== State =====
    var selectedEl = null;
    var selectionType = null; // 'image' | 'container'
    var resizeOverlay = null;
    var guideOverlay = null;
    var centerGuideV = null;
    var centerGuideH = null;
    var dragging = false;
    var resizing = false;
    var resizeHandle = null;
    var dragStart = { x: 0, y: 0 };
    var origState = null;
    var history = [];
    var historyIndex = -1;
    var editIdCounter = 0;
    var SNAP_THRESHOLD = 6; // px in slide coords
    var BORDER_ZONE = 18; // px from image edge → container selection
    var CONTAINER_SELECTORS = '.slide-image, .slide-text, .auto-slide, .slide-layout, .image-grid-2, .image-grid-3, .image-full, .two-col, .col, .metrics, .slide-layout > div';

    // ===== Unique ID =====
    function getEditId(el) {
        if (!el.dataset.editId) {
            el.dataset.editId = 'e' + (++editIdCounter);
        }
        return el.dataset.editId;
    }

    // ===== Container detection =====
    function isContainerEl(el) {
        return el.matches && el.matches(CONTAINER_SELECTORS);
    }

    // ===== Transform state (per element) =====
    // Images: { type: 'image', tx, ty, sx, sy }  — uses transform (no layout impact)
    // Containers: { type: 'container', tx, ty, w, h }  — uses width/height directly
    function getEditState(el) {
        if (!el._editState) {
            var type = isContainerEl(el) ? 'container' : 'image';
            if (type === 'container') {
                var rect = el.getBoundingClientRect();
                var scale = getScale();
                el._editState = {
                    type: 'container',
                    tx: 0, ty: 0,
                    w: rect.width / scale,
                    h: rect.height / scale
                };
            } else {
                el._editState = { type: 'image', tx: 0, ty: 0, sx: 1, sy: 1 };
            }
            el._originalTransform = el.style.transform || '';
            el._originalWidth = el.style.width || '';
            el._originalHeight = el.style.height || '';
            el._originalMaxWidth = el.style.maxWidth || '';
            el._originalMaxHeight = el.style.maxHeight || '';
        }
        return el._editState;
    }

    // Freeze child image sizes so container resize doesn't affect them
    function freezeChildren(containerEl) {
        containerEl.querySelectorAll('img, video').forEach(function(child) {
            if (child._sizesFrozen) return;
            var cRect = child.getBoundingClientRect();
            var scale = getScale();
            child._frozenBefore = {
                width: child.style.width,
                height: child.style.height,
                maxWidth: child.style.maxWidth,
                maxHeight: child.style.maxHeight
            };
            child.style.width = (cRect.width / scale) + 'px';
            child.style.height = (cRect.height / scale) + 'px';
            child.style.maxWidth = 'none';
            child.style.maxHeight = 'none';
            child._sizesFrozen = true;
        });
    }

    // Lock parent flex/grid layout so resizing one child doesn't shift siblings
    function freezeParentLayout(el) {
        var parent = el.parentElement;
        if (!parent) return;
        var cs = window.getComputedStyle(parent);
        if (cs.display !== 'grid' && cs.display !== 'flex') return;
        if (parent._layoutFrozen) return;
        var scale = getScale();
        var rect = parent.getBoundingClientRect();
        parent._layoutFrozenBefore = {
            height: parent.style.height,
            minHeight: parent.style.minHeight,
            alignItems: parent.style.alignItems
        };
        parent.style.height = (rect.height / scale) + 'px';
        parent.style.minHeight = (rect.height / scale) + 'px';
        // Also freeze siblings' positions so they don't reflow
        Array.from(parent.children).forEach(function(sibling) {
            if (sibling === el) return;
            if (sibling._siblingFrozen) return;
            var sRect = sibling.getBoundingClientRect();
            sibling._siblingFrozenBefore = {
                width: sibling.style.width,
                height: sibling.style.height,
                position: sibling.style.position,
                left: sibling.style.left,
                top: sibling.style.top,
                alignSelf: sibling.style.alignSelf
            };
            sibling.style.width = (sRect.width / scale) + 'px';
            sibling.style.height = (sRect.height / scale) + 'px';
            sibling._siblingFrozen = true;
        });
        parent._layoutFrozen = true;
    }

    function applyEditState(el, state) {
        el._editState = Object.assign({}, state);
        var base = el._originalTransform || '';
        if (state.type === 'container') {
            el.style.width = state.w + 'px';
            el.style.height = state.h + 'px';
            el.style.maxWidth = 'none';
            el.style.maxHeight = 'none';
            // translate only, no scale (scale would cascade to children)
            var t = 'translate(' + state.tx + 'px, ' + state.ty + 'px)';
            el.style.transform = (base + ' ' + t).trim();
        } else {
            var edit = 'translate(' + state.tx + 'px, ' + state.ty + 'px) scale(' + state.sx + ', ' + state.sy + ')';
            el.style.transform = (base + ' ' + edit).trim();
            el.style.transformOrigin = 'top left';
        }
    }

    function cloneState(s) {
        if (!s) return s;
        if (s.type === 'container') {
            return { type: 'container', tx: s.tx, ty: s.ty, w: s.w, h: s.h };
        }
        return { type: 'image', tx: s.tx, ty: s.ty, sx: s.sx, sy: s.sy };
    }

    // ===== Reveal scale factor =====
    function getScale() {
        var slidesEl = document.querySelector('.reveal .slides');
        if (!slidesEl) return 1;
        var cs = window.getComputedStyle(slidesEl);
        var match = cs.transform.match(/matrix\(([^)]+)\)/);
        if (!match) return 1;
        return parseFloat(match[1].split(',')[0]) || 1;
    }

    // ===== Toolbar =====
    function buildToolbar() {
        var bar = document.createElement('div');
        bar.className = 'edit-toolbar';
        bar.innerHTML =
            '<span class="edit-toolbar-title">EDIT</span>' +
            '<span class="edit-toolbar-status" id="editStatus">Click center=image · edge/Alt+click=frame · Shift=free · Alt=center scale · right-click=menu</span>' +
            '<button class="edit-btn" id="editUndo" title="Ctrl+Z">↶ Undo</button>' +
            '<button class="edit-btn" id="editRedo" title="Ctrl+Y">↷ Redo</button>' +
            '<button class="edit-btn danger" id="editReset">Reset</button>' +
            '<button class="edit-btn primary" id="editExport">Export CSS</button>' +
            '<button class="edit-btn" id="editExit">Exit</button>';
        document.body.appendChild(bar);
        document.body.classList.add('edit-mode');

        document.getElementById('editUndo').addEventListener('click', undo);
        document.getElementById('editRedo').addEventListener('click', redo);
        document.getElementById('editReset').addEventListener('click', resetChanges);
        document.getElementById('editExport').addEventListener('click', exportChanges);
        document.getElementById('editExit').addEventListener('click', exitEditMode);
    }

    // ===== Text editing =====
    function setupTextEdit() {
        var tags = 'h1, h2, h3, h4, p, li, small, strong';
        document.querySelectorAll('.reveal .slides').forEach(function(slides) {
            slides.querySelectorAll(tags).forEach(function(el) {
                // Skip if has structural children
                if (el.querySelector('h1, h2, h3, p, li, ul, ol, img, video')) return;
                getEditId(el);
                el.dataset.originalText = el.innerHTML;
                el.setAttribute('contenteditable', 'true');
                var beforeText = null;
                el.addEventListener('focus', function() {
                    beforeText = el.innerHTML;
                });
                el.addEventListener('blur', function() {
                    if (beforeText !== null && el.innerHTML !== beforeText) {
                        pushHistory({
                            type: 'text',
                            editId: el.dataset.editId,
                            before: beforeText,
                            after: el.innerHTML
                        });
                    }
                });
                el.addEventListener('keydown', function(e) {
                    if (e.key === 'Escape') el.blur();
                });
            });
        });
    }

    // ===== Check if click is in border zone of element =====
    function isInBorderZone(e, el) {
        var rect = el.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;
        return x < BORDER_ZONE || y < BORDER_ZONE ||
               rect.width - x < BORDER_ZONE || rect.height - y < BORDER_ZONE;
    }

    // ===== Find closest container ancestor =====
    function findContainer(el) {
        var current = el.parentElement;
        while (current && !current.classList.contains('slides')) {
            if (current.matches && current.matches(CONTAINER_SELECTORS)) {
                return current;
            }
            current = current.parentElement;
        }
        return el.parentElement;
    }

    // ===== Image/video edit setup =====
    function setupImageEdit() {
        document.querySelectorAll('.reveal .slides img, .reveal .slides video').forEach(function(el) {
            getEditId(el);
            // Hover: show crosshair cursor in border zone
            el.addEventListener('mousemove', function(e) {
                if (dragging || resizing) return;
                if (isInBorderZone(e, el)) {
                    el.classList.add('hover-border');
                } else {
                    el.classList.remove('hover-border');
                }
            });
            el.addEventListener('mouseleave', function() {
                el.classList.remove('hover-border');
            });
            el.addEventListener('mousedown', function(e) {
                if (e.target !== el) return;
                if (e.button !== 0) return; // only left click
                e.preventDefault();
                e.stopPropagation();

                // Alt+click = select parent frame (explicit)
                if (e.altKey) {
                    var frameAlt = findContainer(el);
                    if (frameAlt) {
                        selectElement(frameAlt, 'container');
                        startDrag(e);
                        return;
                    }
                }

                // If a frame is currently selected AND this image is inside it,
                // drag the whole frame (image moves along via CSS transform cascade)
                if (selectionType === 'container' && selectedEl && selectedEl.contains(el)) {
                    startDrag(e);
                    return;
                }

                // Border zone → select parent frame + start drag
                if (isInBorderZone(e, el)) {
                    var frame = findContainer(el);
                    if (frame) {
                        selectElement(frame, 'container');
                        startDrag(e);
                        return;
                    }
                }

                // Image center click → select image and start drag
                // (re-click on same image also starts drag — no more re-click-to-parent trap)
                if (selectedEl !== el) {
                    selectElement(el, 'image');
                }
                startDrag(e);
            });
            // Right-click context menu
            el.addEventListener('contextmenu', function(e) {
                e.preventDefault();
                e.stopPropagation();
                if (selectedEl !== el) selectElement(el, 'image');
                showContextMenu(e.clientX, e.clientY);
            });
        });
    }

    // ===== Selection =====
    function selectElement(el, type) {
        clearSelection();
        selectedEl = el;
        selectionType = type || 'image';
        getEditId(el);
        if (selectionType === 'container') {
            el.classList.add('edit-selected-container');
        } else {
            el.classList.add('edit-selected-image');
        }
        showResizeHandles(el);
        updateBreadcrumb();
    }

    function clearSelection() {
        if (selectedEl) {
            selectedEl.classList.remove('edit-selected-image');
            selectedEl.classList.remove('edit-selected-container');
            selectedEl = null;
            selectionType = null;
        }
        if (resizeOverlay) { resizeOverlay.remove(); resizeOverlay = null; }
        hideContextMenu();
        updateBreadcrumb();
    }

    function flashStatus(msg, isError) {
        var status = document.getElementById('editStatus');
        if (!status) return;
        var prevHtml = status.innerHTML;
        status.innerHTML = '<span style="color:' + (isError ? '#ff6464' : '#66BB6A') + '">' + msg + '</span>';
        setTimeout(function() {
            updateBreadcrumb();
        }, 1800);
    }

    function updateBreadcrumb() {
        var status = document.getElementById('editStatus');
        if (!status) return;
        if (!selectedEl) {
            status.textContent = history.length + ' change(s) · Click any element to select';
            return;
        }
        var parts = [];
        var cur = selectedEl;
        while (cur && cur.tagName !== 'SECTION' && parts.length < 5) {
            var tag = cur.tagName.toLowerCase();
            if (cur.className && typeof cur.className === 'string') {
                var cls = cur.className.split(/\s+/).filter(function(c){return c && !c.startsWith('edit-');})[0];
                if (cls) tag += '.' + cls;
            }
            parts.unshift(tag);
            cur = cur.parentElement;
        }
        var label = selectionType === 'container' ? '<span style="color:#ff9800">FRAME</span>' : '<span style="color:#4FC3F7">IMAGE</span>';
        status.innerHTML = label + ' · ' + parts.join(' › ');
    }

    // Compute content box (rect excluding padding)
    function getContentBox(el) {
        var rect = el.getBoundingClientRect();
        var cs = window.getComputedStyle(el);
        var pt = parseFloat(cs.paddingTop) || 0;
        var pr = parseFloat(cs.paddingRight) || 0;
        var pb = parseFloat(cs.paddingBottom) || 0;
        var pl = parseFloat(cs.paddingLeft) || 0;
        var bt = parseFloat(cs.borderTopWidth) || 0;
        var br = parseFloat(cs.borderRightWidth) || 0;
        var bb = parseFloat(cs.borderBottomWidth) || 0;
        var bl = parseFloat(cs.borderLeftWidth) || 0;
        return {
            left: rect.left + pl + bl,
            top: rect.top + pt + bt,
            width: rect.width - pl - pr - bl - br,
            height: rect.height - pt - pb - bt - bb,
            right: rect.right - pr - br,
            bottom: rect.bottom - pb - bb
        };
    }

    // Compute the actual visible content rect of an image/video, accounting for object-fit
    function getVisibleRect(el) {
        // For containers (divs), find the deepest visible img/video and use its visible bounds
        if (el.tagName !== 'IMG' && el.tagName !== 'VIDEO') {
            var innerImg = el.querySelector('img, video');
            if (innerImg && el.contains(innerImg)) {
                // Only use inner rect if it's the primary visible content
                var innerRect = getVisibleRect(innerImg);
                var elRect = getContentBox(el);
                // If inner img occupies most of the container, use el's content box
                // else use the larger of the two
                return elRect;
            }
            return getContentBox(el);
        }
        // Image/video: use content box adjusted for object-fit
        var rect = getContentBox(el);
        var naturalW = el.naturalWidth || el.videoWidth || 0;
        var naturalH = el.naturalHeight || el.videoHeight || 0;
        if (!naturalW || !naturalH) return rect;
        var objectFit = window.getComputedStyle(el).objectFit || 'fill';
        if (objectFit === 'fill') return rect;
        var imgRatio = naturalW / naturalH;
        var elemRatio = rect.width / rect.height;
        var w = rect.width, h = rect.height, x = rect.left, y = rect.top;
        if (objectFit === 'contain') {
            if (imgRatio > elemRatio) {
                h = rect.width / imgRatio;
                y = rect.top + (rect.height - h) / 2;
            } else {
                w = rect.height * imgRatio;
                x = rect.left + (rect.width - w) / 2;
            }
        } else if (objectFit === 'cover') {
            // With cover, visible content fills the element box (no adjustment)
        }
        return { left: x, top: y, width: w, height: h, right: x + w, bottom: y + h };
    }

    function showResizeHandles(el) {
        if (resizeOverlay) resizeOverlay.remove();
        var rect = getVisibleRect(el);
        resizeOverlay = document.createElement('div');
        resizeOverlay.className = 'edit-resize-overlay' + (selectionType === 'container' ? ' container' : '');
        resizeOverlay.style.left = rect.left + 'px';
        resizeOverlay.style.top = rect.top + 'px';
        resizeOverlay.style.width = rect.width + 'px';
        resizeOverlay.style.height = rect.height + 'px';

        ['nw','n','ne','w','e','sw','s','se'].forEach(function(dir) {
            var h = document.createElement('div');
            h.className = 'edit-handle ' + dir;
            h.dataset.dir = dir;
            h.addEventListener('mousedown', function(e) {
                e.preventDefault();
                e.stopPropagation();
                startResize(e, dir);
            });
            resizeOverlay.appendChild(h);
        });

        var badge = document.createElement('div');
        badge.className = 'edit-size-badge';
        badge.textContent = Math.round(rect.width) + ' × ' + Math.round(rect.height);
        resizeOverlay.appendChild(badge);

        document.body.appendChild(resizeOverlay);
    }

    function updateOverlayPosition() {
        if (!resizeOverlay || !selectedEl) return;
        var rect = getVisibleRect(selectedEl);
        resizeOverlay.style.left = rect.left + 'px';
        resizeOverlay.style.top = rect.top + 'px';
        resizeOverlay.style.width = rect.width + 'px';
        resizeOverlay.style.height = rect.height + 'px';
        var badge = resizeOverlay.querySelector('.edit-size-badge');
        if (badge) badge.textContent = Math.round(rect.width) + ' × ' + Math.round(rect.height);
    }

    // ===== Drag =====
    function startDrag(e) {
        dragging = true;
        dragStart.x = e.clientX;
        dragStart.y = e.clientY;
        origState = cloneState(getEditState(selectedEl));
        document.body.style.cursor = 'move';
    }

    // ===== Resize =====
    function startResize(e, dir) {
        resizing = true;
        resizeHandle = dir;
        dragStart.x = e.clientX;
        dragStart.y = e.clientY;
        var state = getEditState(selectedEl);
        origState = cloneState(state);
        // For containers, freeze child images so they don't scale along,
        // and lock parent grid/flex layout so siblings don't reflow
        if (state.type === 'container') {
            freezeChildren(selectedEl);
            freezeParentLayout(selectedEl);
        }
        // Capture original unscaled size (slide coords)
        var rect = selectedEl.getBoundingClientRect();
        var scale = getScale();
        if (state.type === 'image') {
            origState.origW = rect.width / scale / origState.sx;
            origState.origH = rect.height / scale / origState.sy;
        } else {
            origState.origW = origState.w;
            origState.origH = origState.h;
        }
        document.body.style.cursor = dir + '-resize';
    }

    // ===== Mouse move/up =====
    document.addEventListener('mousemove', function(e) {
        if (dragging && selectedEl) {
            var scale = getScale();
            var dx = (e.clientX - dragStart.x) / scale;
            var dy = (e.clientY - dragStart.y) / scale;
            var newState = cloneState(origState);
            newState.tx = origState.tx + dx;
            newState.ty = origState.ty + dy;

            // Smart alignment guides + snap
            var snap = computeSnap(selectedEl, newState);
            newState.tx += snap.dx;
            newState.ty += snap.dy;
            drawGuides(snap.guides);

            applyEditState(selectedEl, newState);
            updateOverlayPosition();
            // Container center guides
            drawContainerCenterGuides(selectedEl);
        } else if (resizing && selectedEl) {
            var scale = getScale();
            var dx = (e.clientX - dragStart.x) / scale;
            var dy = (e.clientY - dragStart.y) / scale;
            var newState = cloneState(origState);
            var w = origState.origW;
            var h = origState.origH;
            var dw = 0, dh = 0;
            if (resizeHandle.indexOf('e') !== -1) dw = dx;
            if (resizeHandle.indexOf('w') !== -1) dw = -dx;
            if (resizeHandle.indexOf('s') !== -1) dh = dy;
            if (resizeHandle.indexOf('n') !== -1) dh = -dy;

            var isCorner = resizeHandle.length === 2;
            var ratio = w / h;

            // Aspect ratio logic:
            //   Corner default: maintain ratio (Shift to break free)
            //   Edge default: single axis (Shift to maintain ratio)
            if (isCorner && !e.shiftKey) {
                if (Math.abs(dw) > Math.abs(dh)) dh = dw / ratio;
                else dw = dh * ratio;
            } else if (!isCorner && e.shiftKey) {
                if (dw !== 0) dh = dw / ratio;
                else if (dh !== 0) dw = dh * ratio;
            }

            // Alt = scale from center (both sides move symmetrically)
            var centerScale = e.altKey;
            var wMultiplier = centerScale ? 2 : 1;
            var hMultiplier = centerScale ? 2 : 1;

            var newW = Math.max(20, w + dw * wMultiplier);
            var newH = Math.max(20, h + dh * hMultiplier);
            // Actual delta applied (after clamping to 20 minimum)
            var actualDw = (newW - w) / wMultiplier;
            var actualDh = (newH - h) / hMultiplier;

            if (origState.type === 'container') {
                newState.w = newW;
                newState.h = newH;
            } else {
                newState.sx = newW / w * origState.sx;
                newState.sy = newH / h * origState.sy;
            }

            // Translate adjustment
            if (centerScale) {
                // Anchor center: both X and Y shift by half the delta
                newState.tx = origState.tx - actualDw;
                newState.ty = origState.ty - actualDh;
            } else {
                // Anchor opposite edge
                if (resizeHandle.indexOf('w') !== -1) {
                    newState.tx = origState.tx - actualDw;
                }
                if (resizeHandle.indexOf('n') !== -1) {
                    newState.ty = origState.ty - actualDh;
                }
            }

            applyEditState(selectedEl, newState);
            updateOverlayPosition();
        }
    });

    document.addEventListener('mouseup', function() {
        if (dragging || resizing) {
            clearGuides();
            document.body.style.cursor = '';
            if (selectedEl && origState) {
                var after = cloneState(getEditState(selectedEl));
                var changed = false;
                if (after.type === 'container') {
                    changed = (after.tx !== origState.tx || after.ty !== origState.ty ||
                               after.w !== origState.w || after.h !== origState.h);
                } else {
                    changed = (after.tx !== origState.tx || after.ty !== origState.ty ||
                               after.sx !== origState.sx || after.sy !== origState.sy);
                }
                if (changed) {
                    pushHistory({
                        type: 'transform',
                        editId: selectedEl.dataset.editId,
                        before: cloneState(origState),
                        after: after
                    });
                }
            }
            dragging = false;
            resizing = false;
            origState = null;
        }
    });

    // ===== Smart guides =====
    function computeSnap(movingEl, state) {
        var scale = getScale();
        // Compute proposed rect in screen coords
        var rect = movingEl.getBoundingClientRect();
        // Apply delta from original to get projected rect
        var delta = {
            x: (state.tx - origState.tx) * scale,
            y: (state.ty - origState.ty) * scale
        };
        var proposed = {
            left: rect.left + delta.x,
            top: rect.top + delta.y,
            right: rect.right + delta.x,
            bottom: rect.bottom + delta.y,
            cx: (rect.left + rect.right) / 2 + delta.x,
            cy: (rect.top + rect.bottom) / 2 + delta.y
        };
        // Find alignment with other elements
        var guides = [];
        var snapDx = 0, snapDy = 0;
        var minDx = SNAP_THRESHOLD * scale + 1;
        var minDy = SNAP_THRESHOLD * scale + 1;

        var candidates = document.querySelectorAll('.reveal .slides img, .reveal .slides video, .reveal .slides .slide-image, .reveal .slides .slide-text, .reveal .slides .auto-slide');
        candidates.forEach(function(other) {
            if (other === movingEl) return;
            // Skip children of movingEl
            if (movingEl.contains(other) || other.contains(movingEl)) return;
            var r = other.getBoundingClientRect();
            var oCx = (r.left + r.right) / 2;
            var oCy = (r.top + r.bottom) / 2;

            // Vertical edges (left, cx, right)
            [[proposed.left, r.left, 'left'], [proposed.left, r.right, 'left-right'],
             [proposed.right, r.left, 'right-left'], [proposed.right, r.right, 'right'],
             [proposed.cx, oCx, 'centerX']].forEach(function(pair) {
                var d = pair[1] - pair[0];
                if (Math.abs(d) < minDx) {
                    minDx = Math.abs(d);
                    snapDx = d / scale;
                    guides.push({ type: 'v', x: pair[1], y1: Math.min(r.top, proposed.top), y2: Math.max(r.bottom, proposed.bottom) });
                }
            });
            // Horizontal edges (top, cy, bottom)
            [[proposed.top, r.top, 'top'], [proposed.top, r.bottom, 'top-bottom'],
             [proposed.bottom, r.top, 'bottom-top'], [proposed.bottom, r.bottom, 'bottom'],
             [proposed.cy, oCy, 'centerY']].forEach(function(pair) {
                var d = pair[1] - pair[0];
                if (Math.abs(d) < minDy) {
                    minDy = Math.abs(d);
                    snapDy = d / scale;
                    guides.push({ type: 'h', y: pair[1], x1: Math.min(r.left, proposed.left), x2: Math.max(r.right, proposed.right) });
                }
            });
        });

        return { dx: snapDx, dy: snapDy, guides: guides };
    }

    function drawGuides(guides) {
        if (!guideOverlay) {
            guideOverlay = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            guideOverlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9998;';
            document.body.appendChild(guideOverlay);
        }
        guideOverlay.innerHTML = '';
        guides.forEach(function(g) {
            var line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            if (g.type === 'v') {
                line.setAttribute('x1', g.x);
                line.setAttribute('x2', g.x);
                line.setAttribute('y1', g.y1 - 20);
                line.setAttribute('y2', g.y2 + 20);
            } else {
                line.setAttribute('x1', g.x1 - 20);
                line.setAttribute('x2', g.x2 + 20);
                line.setAttribute('y1', g.y);
                line.setAttribute('y2', g.y);
            }
            line.setAttribute('stroke', '#ff4080');
            line.setAttribute('stroke-width', '1');
            line.setAttribute('stroke-dasharray', '4 2');
            guideOverlay.appendChild(line);
        });
    }

    function clearGuides() {
        if (guideOverlay) guideOverlay.innerHTML = '';
        if (centerGuideV) { centerGuideV.remove(); centerGuideV = null; }
        if (centerGuideH) { centerGuideH.remove(); centerGuideH = null; }
    }

    // ===== Container center guides (crosshair) =====
    function drawContainerCenterGuides(movingEl) {
        var container = findContainer(movingEl);
        if (!container) return;
        var cRect = container.getBoundingClientRect();
        var mRect = movingEl.getBoundingClientRect();
        var cCx = (cRect.left + cRect.right) / 2;
        var cCy = (cRect.top + cRect.bottom) / 2;
        var mCx = (mRect.left + mRect.right) / 2;
        var mCy = (mRect.top + mRect.bottom) / 2;

        // Show vertical center guide if image center is close to container center X
        if (Math.abs(mCx - cCx) < SNAP_THRESHOLD * getScale() * 2) {
            if (!centerGuideV) {
                centerGuideV = document.createElement('div');
                centerGuideV.className = 'edit-center-guide v';
                document.body.appendChild(centerGuideV);
            }
            centerGuideV.style.left = cCx + 'px';
            centerGuideV.style.top = cRect.top + 'px';
            centerGuideV.style.height = cRect.height + 'px';
        } else if (centerGuideV) {
            centerGuideV.remove();
            centerGuideV = null;
        }
        // Horizontal center guide
        if (Math.abs(mCy - cCy) < SNAP_THRESHOLD * getScale() * 2) {
            if (!centerGuideH) {
                centerGuideH = document.createElement('div');
                centerGuideH.className = 'edit-center-guide h';
                document.body.appendChild(centerGuideH);
            }
            centerGuideH.style.top = cCy + 'px';
            centerGuideH.style.left = cRect.left + 'px';
            centerGuideH.style.width = cRect.width + 'px';
        } else if (centerGuideH) {
            centerGuideH.remove();
            centerGuideH = null;
        }
    }

    // ===== Context Menu =====
    var contextMenuEl = null;
    function showContextMenu(x, y) {
        hideContextMenu();
        contextMenuEl = document.createElement('div');
        contextMenuEl.className = 'edit-context-menu';
        // Snapshot selected element so async click handlers don't lose it
        var snapEl = selectedEl;
        var snapType = selectionType;
        var items = [
            { header: 'Selected: ' + (snapType === 'container' ? 'frame' : (snapType || 'none')) },
            { label: 'Fit Image to Frame', action: function() { fitImageToFrame(snapEl); }, disabled: snapType !== 'image' },
            { label: 'Fit Frame to Image', action: function() { fitFrameToImage(snapEl); }, disabled: snapType !== 'image' },
            { label: 'Center in Frame', action: function() { centerInFrame(snapEl); }, disabled: !snapEl },
            { divider: true },
            { label: 'Align with Siblings', action: function() { alignWithSiblings(snapEl); }, disabled: !snapEl },
            { label: 'Copy Position to Siblings', action: function() { alignWithSiblings(snapEl); }, disabled: !snapEl },
            { divider: true },
            { label: 'Select Parent Frame', action: function() {
                if (snapEl) {
                    var p = findContainer(snapEl);
                    if (p) selectElement(p, 'container');
                }
            }, disabled: !snapEl },
            { label: 'Reset Transform', action: function() {
                if (!snapEl) return;
                var before = cloneState(getEditState(snapEl));
                var resetState = before.type === 'container'
                    ? { type: 'container', tx: 0, ty: 0, w: before.w, h: before.h }
                    : { type: 'image', tx: 0, ty: 0, sx: 1, sy: 1 };
                applyEditState(snapEl, resetState);
                pushHistory({ type: 'transform', editId: snapEl.dataset.editId, before: before, after: resetState });
                updateOverlayPosition();
            }, disabled: !snapEl }
        ];
        items.forEach(function(item) {
            if (item.header) {
                var h = document.createElement('div');
                h.className = 'menu-header';
                h.textContent = item.header;
                contextMenuEl.appendChild(h);
                return;
            }
            if (item.divider) {
                var d = document.createElement('div');
                d.className = 'menu-divider';
                contextMenuEl.appendChild(d);
                return;
            }
            var mi = document.createElement('div');
            mi.className = 'menu-item' + (item.disabled ? ' disabled' : '');
            mi.textContent = item.label;
            if (!item.disabled) {
                mi.addEventListener('mousedown', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    try {
                        item.action();
                        flashStatus('✓ ' + item.label);
                    } catch (err) {
                        flashStatus('✗ ' + err.message, true);
                        console.error('Edit action failed:', err);
                    }
                    hideContextMenu();
                });
            }
            contextMenuEl.appendChild(mi);
        });
        contextMenuEl.style.left = x + 'px';
        contextMenuEl.style.top = y + 'px';
        document.body.appendChild(contextMenuEl);
        // Clamp to viewport
        var mRect = contextMenuEl.getBoundingClientRect();
        if (mRect.right > window.innerWidth) {
            contextMenuEl.style.left = (window.innerWidth - mRect.width - 10) + 'px';
        }
        if (mRect.bottom > window.innerHeight) {
            contextMenuEl.style.top = (window.innerHeight - mRect.height - 10) + 'px';
        }
    }

    function hideContextMenu() {
        if (contextMenuEl) { contextMenuEl.remove(); contextMenuEl = null; }
    }

    document.addEventListener('click', function(e) {
        if (contextMenuEl && !contextMenuEl.contains(e.target)) hideContextMenu();
    });
    document.addEventListener('contextmenu', function(e) {
        // Prevent default browser context menu anywhere in edit mode
        if (!e.target.closest('img') && !e.target.closest('video')) {
            hideContextMenu();
        }
    });

    // ===== Fit functions =====
    function fitImageToFrame(el) {
        el = el || selectedEl;
        if (!el) throw new Error('No element selected');
        if (el.tagName !== 'IMG' && el.tagName !== 'VIDEO') throw new Error('Select an image first');
        var before = {
            objectFit: el.style.objectFit,
            width: el.style.width,
            height: el.style.height,
            maxWidth: el.style.maxWidth,
            maxHeight: el.style.maxHeight
        };
        // Reset transform so cover fills frame
        if (el._editState && el._editState.type === 'image') {
            applyEditState(el, { type: 'image', tx: 0, ty: 0, sx: 1, sy: 1 });
        }
        el.style.objectFit = 'cover';
        el.style.width = '100%';
        el.style.height = '100%';
        el.style.maxWidth = 'none';
        el.style.maxHeight = 'none';
        pushHistory({
            type: 'css',
            editId: el.dataset.editId,
            before: before,
            after: { objectFit: 'cover', width: '100%', height: '100%', maxWidth: 'none', maxHeight: 'none' }
        });
        updateOverlayPosition();
    }

    function fitFrameToImage(el) {
        el = el || selectedEl;
        if (!el) throw new Error('No element selected');
        if (el.tagName !== 'IMG' && el.tagName !== 'VIDEO') throw new Error('Select an image first');
        var frame = findContainer(el);
        if (!frame) throw new Error('No parent frame found');
        getEditId(frame);
        var imgRect = el.getBoundingClientRect();
        var scale = getScale();
        var w = imgRect.width / scale;
        var h = imgRect.height / scale;
        var before = {
            width: frame.style.width,
            height: frame.style.height,
            maxWidth: frame.style.maxWidth,
            maxHeight: frame.style.maxHeight
        };
        frame.style.width = Math.round(w) + 'px';
        frame.style.height = Math.round(h) + 'px';
        frame.style.maxWidth = 'none';
        frame.style.maxHeight = 'none';
        // Update frame's edit state if it had one
        if (frame._editState && frame._editState.type === 'container') {
            frame._editState.w = w;
            frame._editState.h = h;
        }
        pushHistory({
            type: 'css',
            editId: frame.dataset.editId,
            before: before,
            after: { width: frame.style.width, height: frame.style.height, maxWidth: 'none', maxHeight: 'none' }
        });
        updateOverlayPosition();
    }

    function centerInFrame(el) {
        el = el || selectedEl;
        if (!el) throw new Error('No element selected');
        var frame = findContainer(el);
        if (!frame) throw new Error('No parent frame found');
        var cRect = frame.getBoundingClientRect();
        var mRect = el.getBoundingClientRect();
        var scale = getScale();
        var dx = ((cRect.left + cRect.right) / 2 - (mRect.left + mRect.right) / 2) / scale;
        var dy = ((cRect.top + cRect.bottom) / 2 - (mRect.top + mRect.bottom) / 2) / scale;
        if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) {
            throw new Error('Already centered');
        }
        var before = cloneState(getEditState(el));
        var after = cloneState(before);
        after.tx = before.tx + dx;
        after.ty = before.ty + dy;
        applyEditState(el, after);
        pushHistory({ type: 'transform', editId: el.dataset.editId, before: before, after: after });
        updateOverlayPosition();
    }

    // ===== Align slideshow siblings =====
    function getSiblingImages(el) {
        // Find siblings within auto-slide, image-grid-2, image-grid-3, slide-layout
        var parent = el.parentElement;
        while (parent && !parent.matches('.auto-slide, .image-grid-2, .image-grid-3')) {
            parent = parent.parentElement;
            if (!parent || parent.classList.contains('slides')) return [];
        }
        if (!parent) return [];
        return Array.from(parent.querySelectorAll('img, video')).filter(function(s) { return s !== el; });
    }

    function alignWithSiblings(el) {
        el = el || selectedEl;
        if (!el) throw new Error('No element selected');
        var siblings = getSiblingImages(el);
        if (siblings.length === 0) {
            throw new Error('No siblings (need auto-slide/image-grid)');
        }
        // Align all siblings to current element's transform
        var targetState = cloneState(getEditState(el));
        siblings.forEach(function(s) {
            getEditId(s);
            var before = cloneState(getEditState(s));
            applyEditState(s, cloneState(targetState));
            pushHistory({ type: 'transform', editId: s.dataset.editId, before: before, after: cloneState(targetState) });
        });
    }

    // ===== History (undo/redo) =====
    function pushHistory(entry) {
        // Drop any redo history
        history = history.slice(0, historyIndex + 1);
        history.push(entry);
        historyIndex = history.length - 1;
        updateBreadcrumb();
    }

    function applyCssSnapshot(el, snap) {
        if (!snap) return;
        Object.keys(snap).forEach(function(prop) {
            var cssProp = prop.replace(/[A-Z]/g, function(m) { return '-' + m.toLowerCase(); });
            el.style[prop] = snap[prop] || '';
        });
    }

    function undo() {
        if (historyIndex < 0) return;
        var entry = history[historyIndex];
        var el = document.querySelector('[data-edit-id="' + entry.editId + '"]');
        if (el) {
            if (entry.type === 'transform') {
                applyEditState(el, entry.before);
            } else if (entry.type === 'text') {
                el.innerHTML = entry.before;
            } else if (entry.type === 'css') {
                applyCssSnapshot(el, entry.before);
            }
        }
        historyIndex--;
        updateOverlayPosition();
        updateBreadcrumb();
    }

    function redo() {
        if (historyIndex >= history.length - 1) return;
        historyIndex++;
        var entry = history[historyIndex];
        var el = document.querySelector('[data-edit-id="' + entry.editId + '"]');
        if (el) {
            if (entry.type === 'transform') {
                applyEditState(el, entry.after);
            } else if (entry.type === 'text') {
                el.innerHTML = entry.after;
            } else if (entry.type === 'css') {
                applyCssSnapshot(el, entry.after);
            }
        }
        updateOverlayPosition();
        updateBreadcrumb();
    }

    // ===== Click outside to deselect =====
    document.addEventListener('mousedown', function(e) {
        if (!selectedEl) return;
        if (e.button !== 0) return; // ignore right-click
        if (e.target === selectedEl) return;
        if (e.target.classList && e.target.classList.contains('edit-handle')) return;
        if (e.target.closest('.edit-toolbar') || e.target.closest('.edit-modal')) return;
        if (e.target.closest('.edit-context-menu')) return;
        if (e.target.closest('[contenteditable="true"]')) return;
        if (selectedEl.contains(e.target)) return;
        clearSelection();
    });

    // ===== Keyboard shortcuts =====
    document.addEventListener('keydown', function(e) {
        // Don't capture while editing text
        if (document.activeElement && document.activeElement.isContentEditable) return;
        if (e.ctrlKey || e.metaKey) {
            if (e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
            else if (e.key === 'y' || (e.key === 'z' && e.shiftKey)) { e.preventDefault(); redo(); }
        } else if (e.key === 'Escape') {
            clearSelection();
        }
    });

    // ===== Reset =====
    function resetChanges() {
        if (!confirm('Reset all changes?')) return;
        document.querySelectorAll('[data-edit-id]').forEach(function(el) {
            if (el._editState) {
                el._editState = null;
                el.style.transform = el._originalTransform || '';
                el.style.width = el._originalWidth || '';
                el.style.height = el._originalHeight || '';
                el.style.maxWidth = el._originalMaxWidth || '';
                el.style.maxHeight = el._originalMaxHeight || '';
            }
            if (el._frozenBefore) {
                el.style.width = el._frozenBefore.width;
                el.style.height = el._frozenBefore.height;
                el.style.maxWidth = el._frozenBefore.maxWidth;
                el.style.maxHeight = el._frozenBefore.maxHeight;
                el._sizesFrozen = false;
                el._frozenBefore = null;
            }
            if (el._layoutFrozenBefore) {
                el.style.height = el._layoutFrozenBefore.height;
                el.style.minHeight = el._layoutFrozenBefore.minHeight;
                el.style.alignItems = el._layoutFrozenBefore.alignItems;
                el._layoutFrozen = false;
                el._layoutFrozenBefore = null;
            }
            if (el._siblingFrozenBefore) {
                Object.keys(el._siblingFrozenBefore).forEach(function(k) {
                    el.style[k] = el._siblingFrozenBefore[k];
                });
                el._siblingFrozen = false;
                el._siblingFrozenBefore = null;
            }
            if (el.dataset.originalText && el.getAttribute('contenteditable') === 'true') {
                el.innerHTML = el.dataset.originalText;
            }
        });
        history = [];
        historyIndex = -1;
        clearSelection();
        updateBreadcrumb();
    }

    // ===== Export =====
    function buildUniqueSelector(el) {
        if (el.id) return '#' + el.id;
        var parts = [];
        var current = el;
        var depth = 0;
        while (current && current.tagName !== 'BODY' && depth < 8) {
            var part = current.tagName.toLowerCase();
            if (current.className && typeof current.className === 'string') {
                var classes = current.className.split(/\s+/).filter(function(c){
                    return c && !c.startsWith('edit-') && c !== 'present' && c !== 'past' && c !== 'future';
                });
                if (classes.length) part += '.' + classes.slice(0, 2).join('.');
            }
            var parent = current.parentElement;
            if (parent) {
                var siblings = Array.from(parent.children).filter(function(c) {
                    return c.tagName === current.tagName;
                });
                if (siblings.length > 1) {
                    part += ':nth-of-type(' + (siblings.indexOf(current) + 1) + ')';
                }
            }
            parts.unshift(part);
            current = current.parentElement;
            depth++;
        }
        return parts.join(' > ');
    }

    function exportChanges() {
        var date = new Date().toISOString().slice(0, 10);
        var lines = ['/* Edit Mode Export — ' + date + ' */', ''];

        // Style changes (from final states)
        var styleElements = [];
        document.querySelectorAll('[data-edit-id]').forEach(function(el) {
            if (el._editState) {
                var s = el._editState;
                if (s.type === 'container') {
                    styleElements.push(el);
                } else if (s.tx !== 0 || s.ty !== 0 || s.sx !== 1 || s.sy !== 1) {
                    styleElements.push(el);
                }
            }
        });
        if (styleElements.length) {
            lines.push('/* ===== Style Changes ===== */');
            styleElements.forEach(function(el) {
                var sel = buildUniqueSelector(el);
                var s = el._editState;
                lines.push(sel + ' {');
                if (s.type === 'container') {
                    lines.push('    width: ' + Math.round(s.w) + 'px !important;');
                    lines.push('    height: ' + Math.round(s.h) + 'px !important;');
                    if (s.tx !== 0 || s.ty !== 0) {
                        lines.push('    transform: translate(' + s.tx.toFixed(1) + 'px, ' + s.ty.toFixed(1) + 'px) !important;');
                    }
                } else {
                    var parts = [];
                    if (s.tx !== 0 || s.ty !== 0) parts.push('translate(' + s.tx.toFixed(1) + 'px, ' + s.ty.toFixed(1) + 'px)');
                    if (s.sx !== 1 || s.sy !== 1) parts.push('scale(' + s.sx.toFixed(3) + ', ' + s.sy.toFixed(3) + ')');
                    lines.push('    transform: ' + parts.join(' ') + ' !important;');
                    lines.push('    transform-origin: top left !important;');
                }
                lines.push('}');
                lines.push('');
            });
        }

        // Text changes
        var textChanges = [];
        document.querySelectorAll('[data-edit-id][contenteditable="true"]').forEach(function(el) {
            if (el.dataset.originalText && el.dataset.originalText !== el.innerHTML) {
                textChanges.push({ sel: buildUniqueSelector(el), before: el.dataset.originalText, after: el.innerHTML });
            }
        });
        if (textChanges.length) {
            lines.push('/* ===== Text Changes (manual HTML edits needed) ===== */');
            textChanges.forEach(function(t) {
                lines.push('/* ' + t.sel + ' */');
                lines.push('/*   FROM: ' + t.before.replace(/\n/g, ' ') + ' */');
                lines.push('/*   TO:   ' + t.after.replace(/\n/g, ' ') + ' */');
                lines.push('');
            });
        }

        if (lines.length === 2) lines.push('/* No changes */');
        showExportModal(lines.join('\n'));
    }

    function showExportModal(output) {
        var existing = document.getElementById('editModal');
        if (existing) existing.remove();
        var overlay = document.createElement('div');
        overlay.className = 'edit-modal-overlay active';
        overlay.id = 'editModal';
        overlay.innerHTML =
            '<div class="edit-modal">' +
                '<h3>Export — Paste into custom.css</h3>' +
                '<div class="edit-modal-body"><pre id="editExportPre"></pre></div>' +
                '<div class="edit-modal-actions">' +
                    '<button class="edit-btn primary" id="editCopyBtn">Copy</button>' +
                    '<button class="edit-btn" id="editCloseModal">Close</button>' +
                '</div>' +
            '</div>';
        document.body.appendChild(overlay);
        document.getElementById('editExportPre').textContent = output;
        document.getElementById('editCopyBtn').addEventListener('click', function() {
            navigator.clipboard.writeText(output).then(function() {
                var b = document.getElementById('editCopyBtn');
                b.textContent = 'Copied!';
                setTimeout(function() { if (b) b.textContent = 'Copy'; }, 1500);
            });
        });
        document.getElementById('editCloseModal').addEventListener('click', function() { overlay.remove(); });
        overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });
    }

    function exitEditMode() {
        var url = new URL(window.location);
        url.searchParams.delete('edit');
        window.location = url.toString();
    }

    // ===== Init =====
    function init() {
        buildToolbar();
        if (typeof Reveal !== 'undefined' && Reveal.isReady && Reveal.isReady()) {
            setupAll();
        } else if (typeof Reveal !== 'undefined') {
            Reveal.on('ready', setupAll);
        } else {
            setTimeout(setupAll, 500);
        }
    }

    function setupAll() {
        setupTextEdit();
        setupImageEdit();
        // Also make .slide-layout, .slide-image, .slide-text, .auto-slide clickable for container selection via Alt+Click
        document.querySelectorAll('.reveal .slides .slide-image, .reveal .slides .slide-text, .reveal .slides .auto-slide, .reveal .slides .slide-layout').forEach(function(el) {
            getEditId(el);
            el.addEventListener('mousedown', function(e) {
                if (!e.altKey) return;
                if (e.target.tagName === 'IMG' || e.target.tagName === 'VIDEO') return;
                e.preventDefault();
                e.stopPropagation();
                selectElement(el);
                startDrag(e);
            });
        });
        if (typeof Reveal !== 'undefined') {
            Reveal.on('slidechanged', function() {
                clearSelection();
                clearGuides();
            });
        }
        window.addEventListener('resize', updateOverlayPosition);
        updateBreadcrumb();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
