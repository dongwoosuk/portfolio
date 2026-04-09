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

    // ===== Transform state (per element) =====
    // Stored as { tx, ty, sx, sy } applied as translate + scale
    function getEditState(el) {
        if (!el._editState) {
            el._editState = { tx: 0, ty: 0, sx: 1, sy: 1 };
            el._originalTransform = el.style.transform || '';
        }
        return el._editState;
    }

    function applyEditState(el, state) {
        el._editState = Object.assign({}, state);
        var base = el._originalTransform || '';
        var edit = 'translate(' + state.tx + 'px, ' + state.ty + 'px) scale(' + state.sx + ', ' + state.sy + ')';
        el.style.transform = (base + ' ' + edit).trim();
        el.style.transformOrigin = 'top left';
    }

    function cloneState(s) {
        return { tx: s.tx, ty: s.ty, sx: s.sx, sy: s.sy };
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
            '<span class="edit-toolbar-status" id="editStatus">Click element to select · drag to move · handles to resize · click again for parent</span>' +
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

                // Border zone → select container
                if (isInBorderZone(e, el)) {
                    var container = findContainer(el);
                    if (container) {
                        selectElement(container, 'container');
                        startDrag(e);
                        return;
                    }
                }

                // Click already-selected image → select parent
                if (selectedEl === el) {
                    var parent = findContainer(el);
                    if (parent) {
                        selectElement(parent, 'container');
                        return;
                    }
                }
                selectElement(el, 'image');
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
        status.innerHTML = '<strong>Selected:</strong> ' + parts.join(' › ') + ' · <em>click again for parent</em>';
    }

    function showResizeHandles(el) {
        if (resizeOverlay) resizeOverlay.remove();
        var rect = el.getBoundingClientRect();
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
        var rect = selectedEl.getBoundingClientRect();
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
        origState = cloneState(getEditState(selectedEl));
        // Capture original unscaled size (slide coords)
        var rect = selectedEl.getBoundingClientRect();
        var scale = getScale();
        origState.origW = rect.width / scale / origState.sx;
        origState.origH = rect.height / scale / origState.sy;
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
            // Aspect ratio for corner (unless Shift)
            if (!e.shiftKey && resizeHandle.length === 2) {
                var ratio = w / h;
                if (Math.abs(dw) > Math.abs(dh)) dh = dw / ratio;
                else dw = dh * ratio;
            }
            var newW = Math.max(20, w + dw);
            var newH = Math.max(20, h + dh);
            newState.sx = newW / w * origState.sx;
            newState.sy = newH / h * origState.sy;
            // Adjust translate for w/n handles so opposite edge stays put
            if (resizeHandle.indexOf('w') !== -1) {
                newState.tx = origState.tx + (w - newW);
            }
            if (resizeHandle.indexOf('n') !== -1) {
                newState.ty = origState.ty + (h - newH);
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
                if (after.tx !== origState.tx || after.ty !== origState.ty ||
                    after.sx !== origState.sx || after.sy !== origState.sy) {
                    pushHistory({
                        type: 'transform',
                        editId: selectedEl.dataset.editId,
                        before: { tx: origState.tx, ty: origState.ty, sx: origState.sx, sy: origState.sy },
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
        var items = [
            { header: 'Selection: ' + (selectionType || 'none') },
            { label: 'Fit Image to Frame', action: fitImageToFrame, disabled: selectionType !== 'image' },
            { label: 'Fit Frame to Image', action: fitFrameToImage, disabled: selectionType !== 'image' },
            { label: 'Center in Container', action: centerInContainer, disabled: !selectedEl },
            { divider: true },
            { label: 'Align with Siblings', action: alignWithSiblings, disabled: !selectedEl },
            { label: 'Copy Position to Siblings', action: copyToSiblings, disabled: !selectedEl },
            { divider: true },
            { label: 'Select Parent Container', action: function() {
                if (selectedEl) {
                    var p = findContainer(selectedEl);
                    if (p) selectElement(p, 'container');
                }
                hideContextMenu();
            }, disabled: !selectedEl },
            { label: 'Delete Transform', action: function() {
                if (selectedEl) {
                    var before = cloneState(getEditState(selectedEl));
                    applyEditState(selectedEl, { tx: 0, ty: 0, sx: 1, sy: 1 });
                    pushHistory({ type: 'transform', editId: selectedEl.dataset.editId, before: before, after: { tx: 0, ty: 0, sx: 1, sy: 1 } });
                    updateOverlayPosition();
                }
                hideContextMenu();
            }, disabled: !selectedEl }
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
                mi.addEventListener('click', function(e) {
                    e.stopPropagation();
                    item.action();
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
    function fitImageToFrame() {
        // Apply object-fit: cover to the image so it fills container
        if (!selectedEl) return;
        var before = { objectFit: selectedEl.style.objectFit, width: selectedEl.style.width, height: selectedEl.style.height };
        selectedEl.style.objectFit = 'cover';
        selectedEl.style.width = '100%';
        selectedEl.style.height = '100%';
        pushHistory({
            type: 'style',
            editId: selectedEl.dataset.editId,
            before: before,
            after: { objectFit: 'cover', width: '100%', height: '100%' }
        });
        updateOverlayPosition();
    }

    function fitFrameToImage() {
        // Reset container to natural size of image
        if (!selectedEl) return;
        var container = findContainer(selectedEl);
        if (!container) return;
        getEditId(container);
        var imgRect = selectedEl.getBoundingClientRect();
        var scale = getScale();
        var w = imgRect.width / scale;
        var h = imgRect.height / scale;
        var before = { width: container.style.width, height: container.style.height, maxWidth: container.style.maxWidth, maxHeight: container.style.maxHeight };
        container.style.width = Math.round(w) + 'px';
        container.style.height = Math.round(h) + 'px';
        container.style.maxWidth = 'none';
        container.style.maxHeight = 'none';
        pushHistory({
            type: 'style',
            editId: container.dataset.editId,
            before: before,
            after: { width: container.style.width, height: container.style.height, maxWidth: 'none', maxHeight: 'none' }
        });
        updateOverlayPosition();
    }

    function centerInContainer() {
        if (!selectedEl) return;
        var container = findContainer(selectedEl);
        if (!container) return;
        var cRect = container.getBoundingClientRect();
        var mRect = selectedEl.getBoundingClientRect();
        var scale = getScale();
        var dx = ((cRect.left + cRect.right) / 2 - (mRect.left + mRect.right) / 2) / scale;
        var dy = ((cRect.top + cRect.bottom) / 2 - (mRect.top + mRect.bottom) / 2) / scale;
        var before = cloneState(getEditState(selectedEl));
        var after = cloneState(before);
        after.tx = before.tx + dx;
        after.ty = before.ty + dy;
        applyEditState(selectedEl, after);
        pushHistory({ type: 'transform', editId: selectedEl.dataset.editId, before: before, after: after });
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

    function alignWithSiblings() {
        if (!selectedEl) return;
        var siblings = getSiblingImages(selectedEl);
        if (siblings.length === 0) {
            alert('No sibling images found (must be inside .auto-slide, .image-grid-2, or .image-grid-3)');
            return;
        }
        // Align all siblings to current element's transform
        var targetState = cloneState(getEditState(selectedEl));
        siblings.forEach(function(s) {
            getEditId(s);
            var before = cloneState(getEditState(s));
            applyEditState(s, targetState);
            pushHistory({ type: 'transform', editId: s.dataset.editId, before: before, after: cloneState(targetState) });
        });
    }

    function copyToSiblings() {
        alignWithSiblings();
    }

    // ===== History (undo/redo) =====
    function pushHistory(entry) {
        // Drop any redo history
        history = history.slice(0, historyIndex + 1);
        history.push(entry);
        historyIndex = history.length - 1;
        updateBreadcrumb();
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
            }
        }
        updateOverlayPosition();
        updateBreadcrumb();
    }

    // ===== Click outside to deselect =====
    document.addEventListener('mousedown', function(e) {
        if (!selectedEl) return;
        if (e.target === selectedEl) return;
        if (e.target.classList && e.target.classList.contains('edit-handle')) return;
        if (e.target.closest('.edit-toolbar') || e.target.closest('.edit-modal')) return;
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
                el._editState = { tx: 0, ty: 0, sx: 1, sy: 1 };
                el.style.transform = el._originalTransform || '';
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
                if (s.tx !== 0 || s.ty !== 0 || s.sx !== 1 || s.sy !== 1) {
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
                var parts = [];
                if (s.tx !== 0 || s.ty !== 0) parts.push('translate(' + s.tx.toFixed(1) + 'px, ' + s.ty.toFixed(1) + 'px)');
                if (s.sx !== 1 || s.sy !== 1) parts.push('scale(' + s.sx.toFixed(3) + ', ' + s.sy.toFixed(3) + ')');
                lines.push('    transform: ' + parts.join(' ') + ' !important;');
                lines.push('    transform-origin: top left !important;');
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
