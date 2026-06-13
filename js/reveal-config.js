// Reveal.js initialization + custom navigation
Reveal.initialize({
    hash: true,
    transition: 'slide',
    slideNumber: 'h.v',
    controls: true,
    progress: true,
    width: 1200,
    height: 700,
    margin: 0,
    minScale: 0.1,
    maxScale: 1.5,
    center: true,
    respondToVisibleSize: true,
    touch: false,
    touchDistance: 200,
}).then(function() {
    // Restart the LEED scroll/swipe CSS animations from the start whenever the slide
    // becomes current (otherwise they keep looping in the background and you'd return
    // mid-cycle).
    function restartLeedAnim(slide) {
        if (!slide) return;
        var els = slide.querySelectorAll('.leed-track, .leed-track-d, .leed-cell img, .leed-cell-d img, .dip-track');
        if (!els.length) return;
        els.forEach(function(el) { el.style.animation = 'none'; });
        void slide.offsetWidth; // reflow so the reset takes effect
        els.forEach(function(el) { el.style.animation = ''; });
    }
    Reveal.on('slidechanged', function(e) { restartLeedAnim(e.currentSlide); });

    // Perf: overview mode (ESC) lays out ALL slides at once. Pause every video AND
    // suspend any loaded iframe (heavy WebGL 3D viewer / dashboard keep their render
    // loops running otherwise) while overview is open, then restore on close.
    var _suspendedIframes = [];
    Reveal.on('overviewshown', function() {
        document.querySelectorAll('.reveal video').forEach(function(v) {
            try { v.pause(); } catch (e) {}
        });
        _suspendedIframes = [];
        document.querySelectorAll('.reveal iframe').forEach(function(f) {
            var s = f.getAttribute('src');
            if (s && s !== 'about:blank') {
                _suspendedIframes.push([f, s]);
                f.setAttribute('src', 'about:blank'); // stops the iframe's render loop
            }
        });
    });
    Reveal.on('overviewhidden', function() {
        _suspendedIframes.forEach(function(pair) { pair[0].setAttribute('src', pair[1]); });
        _suspendedIframes = [];
        var cur = Reveal.getCurrentSlide();
        if (!cur) return;
        cur.querySelectorAll('video[data-autoplay]').forEach(function(v) {
            var p = v.play();
            if (p && p.catch) p.catch(function() {});
        });
    });

    // Mobile: aggressive re-layout on viewport changes (orientation, URL bar, fullscreen)
    var relayout = function() {
        if (!Reveal.layout) return;
        // Force repaint before relayout — fixes stale viewport after orientation change
        var el = document.querySelector('.reveal');
        if (el) { el.style.display = 'none'; el.offsetHeight; el.style.display = ''; }
        Reveal.layout();
    };
    var multiRelayout = function() {
        [100, 300, 600, 1200, 2000].forEach(function(ms) {
            setTimeout(relayout, ms);
        });
    };
    window.addEventListener('resize', multiRelayout);
    window.addEventListener('orientationchange', multiRelayout);
    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', multiRelayout);
    }
    // Delayed initial layout — waits for URL bar auto-hide on mobile
    window.addEventListener('load', multiRelayout);
    // Also relayout when orientation overlay dismisses (fullscreen entry)
    document.addEventListener('fullscreenchange', multiRelayout);
    document.addEventListener('webkitfullscreenchange', multiRelayout);

    // Desktop: mouse wheel slide navigation (throttled, ignored in overview)
    var wheelLocked = false;
    window.addEventListener('wheel', function(e) {
        if (Reveal.isOverview()) return;
        var overlay = document.getElementById('popupOverlay');
        if (overlay && overlay.classList.contains('active')) return;
        if (Math.abs(e.deltaY) < 10) return;
        if (wheelLocked) return;
        wheelLocked = true;
        if (e.deltaY > 0) Reveal.next();
        else Reveal.prev();
        setTimeout(function(){ wheelLocked = false; }, 700);
    }, { passive: true });

    // Custom swipe: stack-aware horizontal navigation.
    // - v=0 (cover) or last slide in a stack → left/right swipe navigates between section covers
    // - mid-stack (v>0 and not last) → horizontal swipes are ignored (only vertical works)
    // - vertical swipes → always Reveal.prev/next
    (function() {
        var revealEl = document.querySelector('.reveal');
        var SWIPE_MIN = 60, SWIPE_RATIO = 1.3, COOLDOWN_MS = 500;
        var sx = 0, sy = 0, tracking = false, locked = false;
        function nav(h, v) {
            if (locked) return;
            locked = true;
            Reveal.slide(h, v, 0);
            setTimeout(function(){ locked = false; }, COOLDOWN_MS);
        }
        revealEl.addEventListener('touchstart', function(e) {
            if (locked) { tracking = false; return; }
            if (e.touches.length !== 1) { tracking = false; return; }
            var overlay = document.getElementById('popupOverlay');
            if (overlay && overlay.classList.contains('active')) { tracking = false; return; }
            if (e.target.closest('.zoom-pan.zoomed, .jump-link, .popup-trigger, .dot, .carousel-btn, .orient-btn, button, a')) {
                tracking = false; return;
            }
            sx = e.touches[0].clientX; sy = e.touches[0].clientY; tracking = true;
        }, { passive: true });
        revealEl.addEventListener('touchend', function(e) {
            if (!tracking) return;
            tracking = false;
            var t = e.changedTouches[0];
            var dx = t.clientX - sx, dy = t.clientY - sy;
            var ax = Math.abs(dx), ay = Math.abs(dy);
            if (ax < SWIPE_MIN && ay < SWIPE_MIN) return;
            var state = Reveal.getIndices();
            var totalH = Reveal.getHorizontalSlides().length;
            if (ax > ay * SWIPE_RATIO) {
                // horizontal swipe
                var parent = Reveal.getCurrentSlide().parentElement;
                var siblings = parent.querySelectorAll(':scope > section');
                var isLastInStack = state.v === siblings.length - 1;
                var canNavHorizontal = state.v === 0 || isLastInStack;
                if (!canNavHorizontal) return; // mid-stack: block
                if (dx < 0) { // swipe left → next section cover
                    if (state.h < totalH - 1) nav(state.h + 1, 0);
                } else { // swipe right → prev section cover
                    if (state.h > 0) nav(state.h - 1, 0);
                }
            } else if (ay > ax * SWIPE_RATIO) {
                // vertical swipe → stack up/down
                if (locked) return;
                locked = true;
                if (dy < 0) Reveal.next();
                else Reveal.prev();
                setTimeout(function(){ locked = false; }, COOLDOWN_MS);
            }
        }, { passive: true });
    })();
    // Jump links
    document.querySelectorAll('.jump-link').forEach(function(link) {
        link.style.cursor = 'pointer';
        link.style.touchAction = 'manipulation';
        var doJump = function(e) {
            e.preventDefault();
            e.stopPropagation();
            var h = parseInt(link.getAttribute('data-h'));
            var vAttr = link.getAttribute('data-v');
            var v = vAttr !== null ? parseInt(vAttr) : 0;
            Reveal.slide(h, v);
        };
        var sx = 0, sy = 0, touched = false;
        link.addEventListener('touchstart', function(e) {
            var t = e.touches[0]; sx = t.clientX; sy = t.clientY; touched = true;
        }, {passive: true});
        link.addEventListener('touchend', function(e) {
            if (!touched) return;
            var t = e.changedTouches[0];
            if (Math.abs(t.clientX - sx) < 10 && Math.abs(t.clientY - sy) < 10) {
                doJump(e);
            }
            touched = false;
        });
        link.addEventListener('click', doJump);
    });

    // On cover pages (v=0), left/right arrows navigate between section covers
    Reveal.addKeyBinding(37, function() {
        var state = Reveal.getIndices();
        if (state.v === 0 && state.h > 0) {
            Reveal.slide(state.h - 1, 0);
        } else {
            Reveal.prev();
        }
    });

    Reveal.addKeyBinding(39, function() {
        var state = Reveal.getIndices();
        if (state.v === 0) {
            var totalH = Reveal.getHorizontalSlides().length;
            if (state.h < totalH - 1) {
                Reveal.slide(state.h + 1, 0);
            }
        } else {
            Reveal.next();
        }
    });

    // Override UI arrow clicks on cover pages
    var controls = document.querySelector('.reveal .controls');
    controls.querySelector('.navigate-left').addEventListener('click', function(e) {
        var state = Reveal.getIndices();
        if (state.v === 0 && state.h > 0) {
            e.stopImmediatePropagation();
            Reveal.slide(state.h - 1, 0);
        }
    }, true);
    controls.querySelector('.navigate-right').addEventListener('click', function(e) {
        var state = Reveal.getIndices();
        if (state.v === 0) {
            e.stopImmediatePropagation();
            var totalH = Reveal.getHorizontalSlides().length;
            if (state.h < totalH - 1) {
                Reveal.slide(state.h + 1, 0);
            }
        }
    }, true);

    // Hide left/right controls inside vertical stacks
    var verticalStacks = [1, 2, 3];
    function updateNav() {
        var state = Reveal.getIndices();
        if (verticalStacks.indexOf(state.h) !== -1 && state.v > 0) {
            controls.classList.add('no-horizontal');
        } else {
            controls.classList.remove('no-horizontal');
        }
    }

    // Vertical dot indicator
    var dotsEl = document.getElementById('slideDots');
    function updateDots() {
        var indices = Reveal.getIndices();
        var currentSlide = Reveal.getCurrentSlide();
        var parent = currentSlide.parentElement;
        var siblings = parent.querySelectorAll(':scope > section');
        var total = siblings.length;

        if (total <= 1) { dotsEl.innerHTML = ''; return; }

        var html = '';
        for (var i = 0; i < total; i++) {
            html += '<span class="dot' + (i === indices.v ? ' active' : '') + '" data-v="' + i + '"></span>';
        }
        dotsEl.innerHTML = html;
    }

    dotsEl.addEventListener('click', function(e) {
        if (e.target.classList.contains('dot')) {
            var v = parseInt(e.target.getAttribute('data-v'));
            var h = Reveal.getIndices().h;
            Reveal.slide(h, v);
        }
    });

    Reveal.on('slidechanged', function(event) {
        updateNav();
        updateDots();
        var comps = event.currentSlide.querySelectorAll('.comp');
        comps.forEach(function(c) {
            if (c._initCenter) { setTimeout(c._initCenter, 50); }
        });
        // Restart videos in the current slide
        var videos = event.currentSlide.querySelectorAll('video');
        videos.forEach(function(v) {
            v.currentTime = 0;
            var p = v.play();
            if (p && typeof p.catch === 'function') { p.catch(function() {}); }
        });
    });
    updateNav();
    updateDots();

    // Overview mode — mouse pan + wheel scroll
    (function() {
        var revealEl = document.querySelector('.reveal');
        var slidesEl = document.querySelector('.reveal .slides');
        var panning = false;
        var startX = 0, startY = 0;
        var panX = 0, panY = 0;
        var baseTransform = '';

        function applyPan() {
            slidesEl.style.transition = 'none';
            slidesEl.style.transform = baseTransform + ' translate(' + panX + 'px, ' + panY + 'px)';
        }

        function captureBase() {
            // Capture Reveal.js's own transform before we modify it
            baseTransform = slidesEl.style.transform || '';
        }

        document.addEventListener('mousedown', function(e) {
            if (!Reveal.isOverview()) return;
            if (e.target.closest('section')) return;
            if (!baseTransform) captureBase();
            panning = true;
            startX = e.clientX - panX;
            startY = e.clientY - panY;
            revealEl.style.cursor = 'grabbing';
            e.preventDefault();
        });

        document.addEventListener('mousemove', function(e) {
            if (!panning) return;
            panX = e.clientX - startX;
            panY = e.clientY - startY;
            applyPan();
            e.preventDefault();
        });

        document.addEventListener('mouseup', function() {
            if (!panning) return;
            panning = false;
            revealEl.style.cursor = Reveal.isOverview() ? 'grab' : '';
        });

        // Wheel scroll in overview (vertical pan) — 2x speed
        revealEl.addEventListener('wheel', function(e) {
            if (!Reveal.isOverview()) return;
            if (!baseTransform) captureBase();
            e.preventDefault();
            panY -= e.deltaY * 3;
            panX -= e.deltaX * 3;
            applyPan();
        }, { passive: false });

        // Reset pan when leaving overview
        Reveal.on('overviewhidden', function() {
            panX = 0;
            panY = 0;
            slidesEl.style.transform = '';
            revealEl.style.cursor = '';
            baseTransform = '';
        });

        // Capture base transform + set cursor when entering overview
        Reveal.on('overviewshown', function() {
            panX = 0;
            panY = 0;
            setTimeout(function() {
                captureBase();
                revealEl.style.cursor = 'grab';
            }, 100);
        });
    })();
});
