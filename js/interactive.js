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

// Auto-slide image carousel (.rtl-slide variant tags prev for slide-out animation)
document.querySelectorAll('.auto-slide').forEach(function(slide) {
    var imgs = slide.querySelectorAll('.auto-slide-img');
    if (imgs.length === 0) return;
    var state = { current: 0 };
    var isRtl = slide.classList.contains('rtl-slide');
    var timerId = null;
    imgs[0].classList.add('active');

    function advance() {
        var prevIdx = state.current;
        state.current = (state.current + 1) % imgs.length;
        imgs[prevIdx].classList.remove('active');
        if (isRtl) {
            imgs[prevIdx].classList.add('prev');
            setTimeout(function() {
                imgs[prevIdx].style.transition = 'none';
                imgs[prevIdx].classList.remove('prev');
                imgs[prevIdx].offsetHeight;
                imgs[prevIdx].style.transition = '';
            }, 620);
        }
        imgs[state.current].classList.add('active');
    }
    function startTimer() {
        if (timerId) clearInterval(timerId);
        var interval = parseInt(slide.getAttribute('data-interval')) || 3000;
        timerId = setInterval(advance, interval);
    }
    slide._resetAutoSlide = function() {
        imgs.forEach(function(img){
            img.classList.remove('active','prev');
            img.style.transition = 'none';
        });
        state.current = 0;
        imgs[0].offsetHeight;
        imgs[0].classList.add('active');
        setTimeout(function(){ imgs.forEach(function(img){ img.style.transition = ''; }); }, 20);
        startTimer();
    };
    startTimer();
});

// Reset auto-slide to first image when its section becomes active
if (window.Reveal) {
    function resetCurrentSlideAutoSlides() {
        var cur = Reveal.getCurrentSlide && Reveal.getCurrentSlide();
        if (!cur) return;
        cur.querySelectorAll('.auto-slide').forEach(function(s) {
            if (typeof s._resetAutoSlide === 'function') s._resetAutoSlide();
        });
    }
    Reveal.on('slidechanged', function(e) {
        if (!e.currentSlide) return;
        e.currentSlide.querySelectorAll('.auto-slide').forEach(function(s) {
            if (typeof s._resetAutoSlide === 'function') s._resetAutoSlide();
        });
    });
    Reveal.on('ready', resetCurrentSlideAutoSlides);
}

// Zoom-pan frames: click toggles zoom (synced across group), pan is per-frame
(function(){
    var scale = 2;
    var groupMembers = {};
    document.querySelectorAll('.zoom-pan').forEach(function(frame) {
        var g = frame.getAttribute('data-zoom-group');
        if (g) {
            if (!groupMembers[g]) groupMembers[g] = [];
            groupMembers[g].push(frame);
        }
    });

    document.querySelectorAll('.zoom-pan').forEach(function(frame) {
        var imgs = frame.querySelectorAll('img');
        var tx = 0, ty = 0;
        var dragging = false, moved = false;
        var sx = 0, sy = 0, startTx = 0, startTy = 0;

        function applyTransform() {
            var s = frame.classList.contains('zoomed') ? scale : 1;
            imgs.forEach(function(img) {
                img.style.transform = 'translate(' + tx + 'px,' + ty + 'px) scale(' + s + ')';
            });
        }
        function clamp() {
            var fw = frame.clientWidth, fh = frame.clientHeight;
            var minX = fw - fw * scale, minY = fh - fh * scale;
            tx = Math.max(minX, Math.min(0, tx));
            ty = Math.max(minY, Math.min(0, ty));
        }
        function zoomIn(cx, cy) {
            var fw = frame.clientWidth, fh = frame.clientHeight;
            var anchor = frame.getAttribute('data-zoom-anchor');
            var px, py;
            var named = {
                center: [0.5, 0.5], top: [0.5, 0], bottom: [0.5, 1],
                left: [0, 0.5], right: [1, 0.5]
            };
            if (anchor && named[anchor]) {
                px = fw * named[anchor][0]; py = fh * named[anchor][1];
            } else if (anchor && /^[\d.]+\s+[\d.]+$/.test(anchor)) {
                var parts = anchor.split(/\s+/).map(parseFloat);
                px = fw * parts[0]; py = fh * parts[1];
            } else {
                var rect = frame.getBoundingClientRect();
                px = cx - rect.left; py = cy - rect.top;
            }
            tx = px - px * scale;
            ty = py - py * scale;
            clamp();
            frame.classList.add('zoomed');
            applyTransform();
        }
        function zoomOut() {
            tx = 0; ty = 0;
            frame.classList.remove('zoomed');
            applyTransform();
        }
        frame.__zoomIn = zoomIn;
        frame.__zoomOut = zoomOut;

        function toggleGroup(e) {
            var groupName = frame.getAttribute('data-zoom-group');
            var peers = groupName ? groupMembers[groupName] : [frame];
            var isZoomed = frame.classList.contains('zoomed');
            if (isZoomed) {
                peers.forEach(function(p) { if (p.__zoomOut) p.__zoomOut(); });
            } else {
                peers.forEach(function(p) {
                    if (p === frame) { p.__zoomIn(e.clientX, e.clientY); }
                    else {
                        // Zoom peer at its own center
                        var r = p.getBoundingClientRect();
                        p.__zoomIn(r.left + r.width/2, r.top + r.height/2);
                    }
                });
            }
        }

        frame.addEventListener('click', function(e) {
            if (moved) { moved = false; return; }
            toggleGroup(e);
            e.stopPropagation();
        });
        frame.addEventListener('mousedown', function(e) {
            if (!frame.classList.contains('zoomed')) return;
            dragging = true; moved = false;
            sx = e.clientX; sy = e.clientY;
            startTx = tx; startTy = ty;
            frame.classList.add('dragging');
            e.preventDefault();
        });
        document.addEventListener('mousemove', function(e) {
            if (!dragging) return;
            var dx = e.clientX - sx, dy = e.clientY - sy;
            if (Math.abs(dx) > 3 || Math.abs(dy) > 3) moved = true;
            tx = startTx + dx; ty = startTy + dy;
            clamp();
            applyTransform();
        });
        document.addEventListener('mouseup', function() {
            if (dragging) { dragging = false; frame.classList.remove('dragging'); }
        });
        frame.addEventListener('touchstart', function(e) {
            if (!frame.classList.contains('zoomed')) return;
            var t = e.touches[0];
            dragging = true; moved = false;
            sx = t.clientX; sy = t.clientY;
            startTx = tx; startTy = ty;
        }, {passive: true});
        frame.addEventListener('touchmove', function(e) {
            if (!dragging) return;
            var t = e.touches[0];
            var dx = t.clientX - sx, dy = t.clientY - sy;
            if (Math.abs(dx) > 3 || Math.abs(dy) > 3) moved = true;
            tx = startTx + dx; ty = startTy + dy;
            clamp();
            applyTransform();
            e.preventDefault();
            e.stopPropagation();
        }, {passive: false});
        frame.addEventListener('touchend', function() { dragging = false; });
    });
})();

// Manual click carousel with slide animation
document.querySelectorAll('.manual-carousel').forEach(function(carousel, idx) {
    var clipContainer = carousel.querySelector('.carousel-clip');
    var slides = (clipContainer || carousel).querySelectorAll('.carousel-slide');
    var prev = carousel.querySelector('.carousel-prev');
    var next = carousel.querySelector('.carousel-next');
    var counter = carousel.querySelector('.carousel-counter') || document.querySelector('.carousel-counter[data-carousel="' + idx + '"]');
    var caption = document.querySelector('.carousel-caption[data-carousel="' + idx + '"]');
    var current = 0;
    var animating = false;
    if (slides.length === 0) return;
    slides[0].classList.add('active');
    slides[0].style.transform = 'translateX(0)';
    slides[0].style.visibility = 'visible';

    function show(index, direction) {
        if (animating) return;
        var newIndex = (index + slides.length) % slides.length;
        if (newIndex === current) return;
        animating = true;

        var oldSlide = slides[current];
        var newSlide = slides[newIndex];
        var enterFrom = direction === 'next' ? '100%' : '-100%';
        var exitTo = direction === 'next' ? '-100%' : '100%';

        // Position new slide at entry edge (no transition)
        newSlide.style.transition = 'none';
        newSlide.style.transform = 'translateX(' + enterFrom + ')';
        newSlide.style.visibility = 'visible';
        newSlide.offsetHeight; // force reflow

        // Animate both
        newSlide.style.transition = 'transform 0.35s ease';
        oldSlide.style.transition = 'transform 0.35s ease';
        newSlide.style.transform = 'translateX(0)';
        oldSlide.style.transform = 'translateX(' + exitTo + ')';

        setTimeout(function() {
            oldSlide.classList.remove('active');
            oldSlide.style.transition = '';
            oldSlide.style.transform = '';
            oldSlide.style.visibility = '';

            newSlide.classList.add('active');
            newSlide.style.transition = '';
            current = newIndex;
            animating = false;
        }, 360);

        if (counter) counter.textContent = (newIndex + 1) + ' / ' + slides.length;
        if (caption) caption.innerHTML = newSlide.getAttribute('data-caption') || '';
    }

    if (counter) counter.textContent = '1 / ' + slides.length;
    if (caption) caption.innerHTML = slides[0].getAttribute('data-caption') || '';
    if (prev) prev.addEventListener('click', function(e) { e.preventDefault(); e.stopPropagation(); show(current - 1, 'prev'); });
    if (next) next.addEventListener('click', function(e) { e.preventDefault(); e.stopPropagation(); show(current + 1, 'next'); });
});
