// Image Comparison Slider — single event delegation pattern
(function() {
    var activeComp = null;
    var startMouseX = 0;
    var startPx = 0;

    function getScale(comp) {
        var r = comp.getBoundingClientRect();
        return r.width / comp.clientWidth;
    }

    function setPos(comp, px) {
        var reveal = comp.querySelector('.comp-reveal');
        var handle = comp.querySelector('.comp-handle');
        var tagL = comp.querySelector('.comp-tag-l');
        var tagR = comp.querySelector('.comp-tag-r');
        var w = comp.clientWidth;
        px = Math.max(0, Math.min(w, px));
        reveal.style.clipPath = 'inset(0 0 0 ' + px + 'px)';
        handle.style.left = px + 'px';
        var p = px / w;
        tagL.style.opacity = p > 0.3 ? '1' : '0';
        tagR.style.opacity = p < 0.7 ? '1' : '0';
    }

    function initCenter(comp) {
        var bgEl = comp.querySelector('.comp-bg');
        var cw = comp.clientWidth, ch = comp.clientHeight;
        var nw = bgEl.naturalWidth || 1, nh = bgEl.naturalHeight || 1;
        var s = Math.min(cw / nw, ch / nh);
        var iw = nw * s;
        var offsetX = (cw - iw) / 2;
        setPos(comp, offsetX + iw / 2 - 7);
    }

    document.addEventListener('DOMContentLoaded', function() {
        document.querySelectorAll('.comp').forEach(function(comp) {
            var bg = comp.querySelector('.comp-bg');
            bg.addEventListener('load', function() { initCenter(comp); });
            if (bg.complete) { setTimeout(function() { initCenter(comp); }, 100); }

            comp._initCenter = function() { initCenter(comp); };

            comp.addEventListener('mousedown', function(e) {
                activeComp = comp;
                startMouseX = e.clientX;
                startPx = parseFloat(comp.querySelector('.comp-handle').style.left) || comp.clientWidth / 2;
                e.preventDefault();
                e.stopPropagation();
            });

            comp.addEventListener('touchstart', function(e) {
                activeComp = comp;
                startMouseX = e.touches[0].clientX;
                startPx = parseFloat(comp.querySelector('.comp-handle').style.left) || comp.clientWidth / 2;
                e.preventDefault();
                e.stopPropagation();
            });
        });
    });

    // Single global listeners for drag
    document.addEventListener('mousemove', function(e) {
        if (!activeComp) return;
        var delta = (e.clientX - startMouseX) / getScale(activeComp);
        setPos(activeComp, startPx + delta);
        e.preventDefault();
    });
    document.addEventListener('mouseup', function() { activeComp = null; });

    document.addEventListener('touchmove', function(e) {
        if (!activeComp) return;
        var delta = (e.touches[0].clientX - startMouseX) / getScale(activeComp);
        setPos(activeComp, startPx + delta);
        e.preventDefault();
    }, { passive: false });
    document.addEventListener('touchend', function() { activeComp = null; });
})();

// Magnify glass effect
document.querySelectorAll('.magnify-wrap').forEach(function(wrap) {
    var img = wrap.querySelector('.magnify-src');
    var glass = wrap.querySelector('.magnify-glass');
    var zoom = 10;

    wrap.addEventListener('mouseenter', function() {
        glass.style.display = 'block';
        glass.style.backgroundImage = 'url(' + img.src + ')';
        glass.style.backgroundSize = (img.clientWidth * zoom) + 'px ' + (img.clientHeight * zoom) + 'px';
    });

    wrap.addEventListener('mousemove', function(e) {
        var rect = img.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;
        var gw = 160, gh = 160;

        glass.style.left = (x - gw / 2) + 'px';
        glass.style.top = (y - gh / 2) + 'px';

        var bgX = -(x * zoom - gw / 2);
        var bgY = -(y * zoom - gh / 2);
        glass.style.backgroundPosition = bgX + 'px ' + bgY + 'px';
    });

    wrap.addEventListener('mouseleave', function() {
        glass.style.display = 'none';
    });
});

// Auto-slide image carousel
document.querySelectorAll('.auto-slide').forEach(function(slide) {
    var imgs = slide.querySelectorAll('.auto-slide-img');
    if (imgs.length === 0) return;
    var current = 0;
    imgs[0].classList.add('active');
    setInterval(function() {
        imgs[current].classList.remove('active');
        current = (current + 1) % imgs.length;
        imgs[current].classList.add('active');
    }, 4000);
});
