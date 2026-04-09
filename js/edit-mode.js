// ===== Portfolio Edit Mode =====
// Activate by adding ?edit=1 to URL
// Provides: text contenteditable, image drag/resize, CSS export

(function() {
    // Check URL parameter
    var params = new URLSearchParams(window.location.search);
    if (params.get('edit') !== '1') return;

    // ===== State =====
    var changes = {
        styles: {},  // selector → { property: value }
        texts: {}    // selector → { original, current }
    };
    var selectedEl = null;
    var resizeOverlay = null;
    var dragging = false;
    var resizing = false;
    var dragStart = { x: 0, y: 0 };
    var origTransform = { x: 0, y: 0 };
    var resizeHandle = null;
    var origRect = null;

    // ===== Utility: get Reveal scale =====
    function getScale() {
        var slidesEl = document.querySelector('.reveal .slides');
        if (!slidesEl) return 1;
        var transform = window.getComputedStyle(slidesEl).transform;
        if (transform === 'none') return 1;
        var match = transform.match(/matrix\(([^)]+)\)/);
        if (!match) return 1;
        return parseFloat(match[1].split(',')[0]) || 1;
    }

    // ===== Utility: build CSS selector for element =====
    function buildSelector(el) {
        if (el.id) return '#' + el.id;
        var parts = [];
        var current = el;
        var depth = 0;
        while (current && current.tagName !== 'BODY' && depth < 5) {
            var part = current.tagName.toLowerCase();
            if (current.className && typeof current.className === 'string') {
                var classes = current.className.split(/\s+/).filter(function(c) {
                    return c && !c.startsWith('edit-') && c !== 'present' && c !== 'past' && c !== 'future';
                });
                if (classes.length) part += '.' + classes.join('.');
            }
            // Add nth-child if siblings exist with same tag
            var parent = current.parentElement;
            if (parent) {
                var siblings = Array.from(parent.children).filter(function(c) {
                    return c.tagName === current.tagName;
                });
                if (siblings.length > 1) {
                    var idx = siblings.indexOf(current) + 1;
                    part += ':nth-of-type(' + idx + ')';
                }
            }
            parts.unshift(part);
            current = current.parentElement;
            depth++;
        }
        return parts.join(' > ');
    }

    // ===== Utility: parse current transform translate =====
    function getTransformXY(el) {
        var t = el.style.transform || '';
        var m = t.match(/translate\(([-0-9.]+)px,\s*([-0-9.]+)px\)/);
        if (m) return { x: parseFloat(m[1]), y: parseFloat(m[2]) };
        return { x: 0, y: 0 };
    }

    function setTransformXY(el, x, y) {
        // Preserve other transforms if any
        var t = el.style.transform || '';
        var stripped = t.replace(/translate\([^)]+\)/g, '').trim();
        el.style.transform = (stripped + ' translate(' + x + 'px, ' + y + 'px)').trim();
    }

    // ===== Build toolbar =====
    function buildToolbar() {
        var bar = document.createElement('div');
        bar.className = 'edit-toolbar';
        bar.innerHTML =
            '<span class="edit-toolbar-title">EDIT MODE</span>' +
            '<span class="edit-toolbar-status" id="editStatus">Click any text to edit, drag images to move/resize</span>' +
            '<button class="edit-btn danger" id="editReset">Reset</button>' +
            '<button class="edit-btn primary" id="editExport">Export CSS</button>' +
            '<button class="edit-btn" id="editExit">Exit</button>';
        document.body.appendChild(bar);
        document.body.classList.add('edit-mode');

        document.getElementById('editReset').addEventListener('click', resetChanges);
        document.getElementById('editExport').addEventListener('click', exportChanges);
        document.getElementById('editExit').addEventListener('click', exitEditMode);
    }

    // ===== Make text editable =====
    var TEXT_TAGS = ['H1', 'H2', 'H3', 'H4', 'P', 'LI', 'SPAN', 'SMALL', 'STRONG'];
    function setupTextEdit() {
        document.querySelectorAll('.reveal .slides h1, .reveal .slides h2, .reveal .slides h3, .reveal .slides h4, .reveal .slides p, .reveal .slides li, .reveal .slides small').forEach(function(el) {
            // Skip if contains other editable children
            var hasEditableChild = el.querySelector('h1, h2, h3, p, li, ul, ol');
            if (hasEditableChild) return;
            // Save original
            el.dataset.originalText = el.innerHTML;
            el.setAttribute('contenteditable', 'true');
            el.addEventListener('blur', function() {
                if (el.innerHTML !== el.dataset.originalText) {
                    var sel = buildSelector(el);
                    changes.texts[sel] = {
                        original: el.dataset.originalText,
                        current: el.innerHTML
                    };
                    updateStatus();
                }
            });
            el.addEventListener('keydown', function(e) {
                if (e.key === 'Escape') el.blur();
            });
        });
    }

    // ===== Image/video drag + resize =====
    function setupImageEdit() {
        document.querySelectorAll('.reveal .slides img, .reveal .slides video').forEach(function(el) {
            // Save original transform
            el.dataset.originalTransform = el.style.transform || '';
            el.dataset.originalWidth = el.style.width || '';
            el.dataset.originalHeight = el.style.height || '';
            el.dataset.originalMaxWidth = el.style.maxWidth || '';
            el.dataset.originalMaxHeight = el.style.maxHeight || '';

            el.addEventListener('mousedown', function(e) {
                if (e.target !== el) return;
                e.preventDefault();
                e.stopPropagation();
                selectImage(el);
                startDrag(e);
            });
        });

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }

    function selectImage(el) {
        if (selectedEl === el) return;
        clearSelection();
        selectedEl = el;
        el.classList.add('edit-selected');
        showResizeHandles(el);
    }

    function clearSelection() {
        if (selectedEl) {
            selectedEl.classList.remove('edit-selected');
            selectedEl = null;
        }
        if (resizeOverlay) {
            resizeOverlay.remove();
            resizeOverlay = null;
        }
    }

    function showResizeHandles(el) {
        if (resizeOverlay) resizeOverlay.remove();
        var rect = el.getBoundingClientRect();
        resizeOverlay = document.createElement('div');
        resizeOverlay.className = 'edit-resize-overlay';
        resizeOverlay.style.left = rect.left + 'px';
        resizeOverlay.style.top = rect.top + 'px';
        resizeOverlay.style.width = rect.width + 'px';
        resizeOverlay.style.height = rect.height + 'px';

        var handles = ['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se'];
        handles.forEach(function(dir) {
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

    function startDrag(e) {
        dragging = true;
        var scale = getScale();
        dragStart.x = e.clientX;
        dragStart.y = e.clientY;
        origTransform = getTransformXY(selectedEl);
        document.body.style.cursor = 'move';
    }

    function startResize(e, dir) {
        resizing = true;
        resizeHandle = dir;
        var rect = selectedEl.getBoundingClientRect();
        var scale = getScale();
        origRect = {
            x: e.clientX,
            y: e.clientY,
            width: rect.width / scale,
            height: rect.height / scale
        };
        document.body.style.cursor = dir + '-resize';
    }

    function onMouseMove(e) {
        if (dragging && selectedEl) {
            var scale = getScale();
            var dx = (e.clientX - dragStart.x) / scale;
            var dy = (e.clientY - dragStart.y) / scale;
            setTransformXY(selectedEl, origTransform.x + dx, origTransform.y + dy);
            updateOverlayPosition();
            recordStyleChange(selectedEl, 'transform', selectedEl.style.transform);
        } else if (resizing && selectedEl) {
            var scale = getScale();
            var dx = (e.clientX - origRect.x) / scale;
            var dy = (e.clientY - origRect.y) / scale;
            var newW = origRect.width;
            var newH = origRect.height;
            if (resizeHandle.includes('e')) newW = origRect.width + dx;
            if (resizeHandle.includes('w')) newW = origRect.width - dx;
            if (resizeHandle.includes('s')) newH = origRect.height + dy;
            if (resizeHandle.includes('n')) newH = origRect.height - dy;
            // Maintain aspect ratio for corner handles unless Shift held
            if (!e.shiftKey && resizeHandle.length === 2) {
                var ratio = origRect.width / origRect.height;
                if (Math.abs(dx) > Math.abs(dy)) {
                    newH = newW / ratio;
                } else {
                    newW = newH * ratio;
                }
            }
            newW = Math.max(20, newW);
            newH = Math.max(20, newH);
            selectedEl.style.width = Math.round(newW) + 'px';
            selectedEl.style.height = Math.round(newH) + 'px';
            selectedEl.style.maxWidth = 'none';
            selectedEl.style.maxHeight = 'none';
            updateOverlayPosition();
            recordStyleChange(selectedEl, 'width', selectedEl.style.width);
            recordStyleChange(selectedEl, 'height', selectedEl.style.height);
            recordStyleChange(selectedEl, 'max-width', 'none');
            recordStyleChange(selectedEl, 'max-height', 'none');
        }
    }

    function onMouseUp() {
        if (dragging || resizing) {
            dragging = false;
            resizing = false;
            resizeHandle = null;
            document.body.style.cursor = '';
            updateStatus();
        }
    }

    function recordStyleChange(el, prop, value) {
        var sel = buildSelector(el);
        if (!changes.styles[sel]) changes.styles[sel] = {};
        changes.styles[sel][prop] = value;
    }

    // ===== Click outside to deselect =====
    document.addEventListener('mousedown', function(e) {
        if (!selectedEl) return;
        if (e.target === selectedEl) return;
        if (e.target.classList && e.target.classList.contains('edit-handle')) return;
        if (e.target.closest('.edit-toolbar') || e.target.closest('.edit-modal')) return;
        clearSelection();
    });

    // ===== Status update =====
    function updateStatus() {
        var styleCount = Object.keys(changes.styles).length;
        var textCount = Object.keys(changes.texts).length;
        var status = document.getElementById('editStatus');
        if (status) {
            status.textContent = styleCount + ' style change(s), ' + textCount + ' text change(s)';
        }
    }

    // ===== Reset =====
    function resetChanges() {
        if (!confirm('Reset all changes?')) return;
        // Restore styles
        Object.keys(changes.styles).forEach(function(sel) {
            // Find element via stored data
            var el = document.querySelector(sel);
            if (el) {
                el.style.transform = el.dataset.originalTransform || '';
                el.style.width = el.dataset.originalWidth || '';
                el.style.height = el.dataset.originalHeight || '';
                el.style.maxWidth = el.dataset.originalMaxWidth || '';
                el.style.maxHeight = el.dataset.originalMaxHeight || '';
            }
        });
        // Restore texts
        document.querySelectorAll('[contenteditable="true"]').forEach(function(el) {
            if (el.dataset.originalText) el.innerHTML = el.dataset.originalText;
        });
        changes = { styles: {}, texts: {} };
        clearSelection();
        updateStatus();
    }

    // ===== Export =====
    function exportChanges() {
        var lines = [];
        var date = new Date().toISOString().slice(0, 10);
        lines.push('/* Edit Mode Export — ' + date + ' */');
        lines.push('');

        // CSS section
        if (Object.keys(changes.styles).length) {
            lines.push('/* ===== Style Changes ===== */');
            Object.keys(changes.styles).forEach(function(sel) {
                lines.push(sel + ' {');
                var props = changes.styles[sel];
                Object.keys(props).forEach(function(prop) {
                    lines.push('    ' + prop + ': ' + props[prop] + ' !important;');
                });
                lines.push('}');
                lines.push('');
            });
        }

        // Text section
        if (Object.keys(changes.texts).length) {
            lines.push('/* ===== Text Changes ===== */');
            Object.keys(changes.texts).forEach(function(sel) {
                var t = changes.texts[sel];
                lines.push('/* ' + sel + ' */');
                lines.push('/*   FROM: ' + t.original.replace(/\n/g, ' ') + ' */');
                lines.push('/*   TO:   ' + t.current.replace(/\n/g, ' ') + ' */');
                lines.push('');
            });
        }

        if (lines.length === 2) {
            lines.push('/* No changes yet */');
        }

        var output = lines.join('\n');
        showExportModal(output);
    }

    function showExportModal(output) {
        var existing = document.getElementById('editModal');
        if (existing) existing.remove();
        var overlay = document.createElement('div');
        overlay.className = 'edit-modal-overlay active';
        overlay.id = 'editModal';
        overlay.innerHTML =
            '<div class="edit-modal">' +
                '<h3>Export — Copy &amp; paste into custom.css</h3>' +
                '<div class="edit-modal-body"><pre id="editExportPre"></pre></div>' +
                '<div class="edit-modal-actions">' +
                    '<button class="edit-btn primary" id="editCopyBtn">Copy to Clipboard</button>' +
                    '<button class="edit-btn" id="editCloseModal">Close</button>' +
                '</div>' +
            '</div>';
        document.body.appendChild(overlay);
        document.getElementById('editExportPre').textContent = output;
        document.getElementById('editCopyBtn').addEventListener('click', function() {
            navigator.clipboard.writeText(output).then(function() {
                document.getElementById('editCopyBtn').textContent = 'Copied!';
                setTimeout(function() {
                    var b = document.getElementById('editCopyBtn');
                    if (b) b.textContent = 'Copy to Clipboard';
                }, 1500);
            });
        });
        document.getElementById('editCloseModal').addEventListener('click', function() {
            overlay.remove();
        });
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) overlay.remove();
        });
    }

    // ===== Exit =====
    function exitEditMode() {
        var url = new URL(window.location);
        url.searchParams.delete('edit');
        window.location = url.toString();
    }

    // ===== Init =====
    function init() {
        buildToolbar();
        // Wait for Reveal to be ready
        if (typeof Reveal !== 'undefined' && Reveal.isReady && Reveal.isReady()) {
            setupAfterReveal();
        } else if (typeof Reveal !== 'undefined') {
            Reveal.on('ready', setupAfterReveal);
        } else {
            setTimeout(setupAfterReveal, 500);
        }
    }

    function setupAfterReveal() {
        setupTextEdit();
        setupImageEdit();
        // Update overlay on slide change
        if (typeof Reveal !== 'undefined') {
            Reveal.on('slidechanged', function() {
                clearSelection();
            });
        }
        // Reposition overlay on scroll/resize
        window.addEventListener('resize', updateOverlayPosition);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
