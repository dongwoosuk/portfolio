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
}).then(function() {
    // Mobile: re-layout on viewport changes (URL bar show/hide, orientation)
    var relayout = function() { if (Reveal.layout) Reveal.layout(); };
    window.addEventListener('resize', relayout);
    window.addEventListener('orientationchange', function() {
        setTimeout(relayout, 300);
    });
    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', relayout);
    }
    // Delayed initial layout — waits for URL bar auto-hide on mobile
    window.addEventListener('load', function() {
        setTimeout(relayout, 300);
        setTimeout(relayout, 800);
    });

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
    // Jump links
    document.querySelectorAll('.jump-link').forEach(function(link) {
        link.style.cursor = 'pointer';
        link.style.touchAction = 'manipulation';
        var doJump = function(e) {
            e.preventDefault();
            e.stopPropagation();
            var h = parseInt(link.getAttribute('data-h'));
            Reveal.slide(h, 0);
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
