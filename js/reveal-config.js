// Reveal.js initialization + custom navigation
Reveal.initialize({
    hash: true,
    transition: 'slide',
    slideNumber: true,
    controls: true,
    progress: true,
    width: 1200,
    height: 700,
    margin: 0.02,
    minScale: 0.2,
    maxScale: 1.5,
    respondToVisibleSize: true,
}).then(function() {
    // Jump links
    document.querySelectorAll('.jump-link').forEach(function(link) {
        link.style.cursor = 'pointer';
        link.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            var h = parseInt(this.getAttribute('data-h'));
            Reveal.slide(h, 0);
        });
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
    });
    updateNav();
    updateDots();
});
