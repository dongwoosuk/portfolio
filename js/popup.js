// Popup data + gallery logic
var popupData = {
    pavilion: {
        gallery: [
            { img: 'assets/images/career/2-Oyler_Wu_Collaborative-_The_Exchange.jpg', caption: 'The Exchange - Exhibit Columbus' },
            { img: 'assets/images/career/10-Oyler_Wu_Collaborative-_The_Exchange.jpg', caption: 'The Exchange - Exhibit Columbus' },
            { img: 'assets/images/career/14-Oyler_Wu_Collaborative-_The_Exchange.jpg', caption: 'The Exchange - Exhibit Columbus' },
            { vimeo: '258852233', caption: 'The Exchange - Exhibit Columbus' }
        ]
    },
    exhibition: {
        gallery: [
            { img: 'assets/images/career/19-Oyler_Wu_Collaborative-_Quicksilver.jpg', caption: 'Quicksilver - Exhibition at JUT Art Museum in Taipei' },
            { img: 'assets/images/career/8-Oyler_Wu_Collaborative-_Quicksilver.jpg', caption: 'Quicksilver - Exhibition at JUT Art Museum in Taipei' },
            { img: 'assets/images/career/1b-Oyler_Wu_Collaborative-_Quicksilver.jpg', caption: 'Quicksilver - Exhibition at JUT Art Museum in Taipei' },
            { img: 'assets/images/career/4b-Oyler_Wu_Collaborative-_Quicksilver.jpg', caption: 'Quicksilver - Exhibition at JUT Art Museum in Taipei' }
        ]
    },
    exchange: {
        gallery: [
            { img: 'assets/images/career/2-Oyler_Wu_Collaborative-_The_Exchange.jpg', caption: 'The Exchange - Exhibit Columbus' },
            { img: 'assets/images/career/10-Oyler_Wu_Collaborative-_The_Exchange.jpg', caption: 'The Exchange - Exhibit Columbus' },
            { img: 'assets/images/career/14-Oyler_Wu_Collaborative-_The_Exchange.jpg', caption: 'The Exchange - Exhibit Columbus' },
            { vimeo: '258852233', caption: 'The Exchange - Exhibit Columbus' }
        ]
    },
    ellore: {
        gallery: [
            { img: 'assets/images/career/web/18041_200_Ellore_N26_website.jpg', caption: 'Ellore - Senior Living Project' },
            { img: 'assets/images/career/web/18041_200_Ellore_N24_website.jpg', caption: 'Ellore - Senior Living Project' },
            { img: 'assets/images/career/web/18041_200_Ellore_N23_website.jpg', caption: 'Ellore - Senior Living Project' },
            { img: 'assets/images/career/web/18041_200_Ellore_N13_website.jpg', caption: 'Ellore - Senior Living Project' },
            { img: 'assets/images/career/web/18041_200_Ellore_N4_website.jpg', caption: 'Ellore - Senior Living Project' },
            { img: 'assets/images/career/web/18041_200_Ellore_N6_website.jpg', caption: 'Ellore - Senior Living Project' }
        ]
    },
    clara: {
        gallery: [
            { img: 'assets/images/career/web/18041_200_N46_website.jpg', caption: 'The Clara - Luxury Residential Apartment' },
            { img: 'assets/images/career/web/18041_100_The_Clara_N8_website.jpg', caption: 'The Clara - Luxury Residential Apartment' },
            { img: 'assets/images/career/web/18041_100_The_Clara_N11_website.jpg', caption: 'The Clara - Luxury Residential Apartment' },
            { img: 'assets/images/career/web/18041_100_The_Clara_N14_website.jpg', caption: 'The Clara - Luxury Residential Apartment' },
            { img: 'assets/images/career/web/18041_100_The_Clara_N16_website.jpg', caption: 'The Clara - Luxury Residential Apartment' },
            { img: 'assets/images/career/web/18041_100_The_Clara_N20_website.jpg', caption: 'The Clara - Luxury Residential Apartment' }
        ]
    },
    '5x5render': {
        img: 'assets/images/rir/01_5x5_building/Computational_Modeling_Presentation_ADG Firmwide Page 062_web.jpg',
        caption: '5x5 Building — AI-Powered Concept Rendering'
    },
    calpoly: {
        gallery: [
            { img: 'assets/images/rir/02_calpoly_model_group/23133_000_high_web.jpg', caption: 'Cal Poly Modular Student Housing — Aerial View' },
            { img: 'assets/images/rir/02_calpoly_model_group/23133_000_N17_high_web.jpg', caption: 'Cal Poly Modular Student Housing — Exterior View' },
            { img: 'assets/images/rir/02_calpoly_model_group/K3_03_Rendering_HeroBuilding.jpg', caption: 'Cal Poly Modular Student Housing — Hero Building' },
            { img: 'assets/images/rir/02_calpoly_model_group/K3_04_Rendering_CentralPlaza.jpg', caption: 'Cal Poly Modular Student Housing — Central Plaza' }
        ]
    },
    fritplot: {
        img: 'assets/images/rir/04_frit_pattern/Frit Design Plot (2)_web.jpg',
        caption: 'Frit Pattern — Full-Scale Design Plot'
    },
    archiol: {
        gallery: [
            { img: 'assets/images/competitions/rendering Final1.jpg', caption: 'Archiol Competition 2025 — Elevated Communities, 1st Place' },
            { img: 'assets/images/competitions/bird eye view render2.jpg', caption: 'Archiol Competition 2025 — Elevated Communities, 1st Place' },
            { img: 'assets/images/competitions/Elevated Communities_0201_UN_DOS Page 003 - CROPPED.jpg', caption: 'Archiol Competition 2025 — Elevated Communities, 1st Place' },
            { img: 'assets/images/competitions/Gemini_Generated_Image_oyyo2hoyyo2hoyyo Firefly Upscaler 4x scale.png', caption: 'Archiol Competition 2025 — Elevated Communities, 1st Place' },
            { img: 'assets/images/competitions/render_03 Topaz Gigapixel 4x scale_cropped.jpg', caption: 'Archiol Competition 2025 — Elevated Communities, 1st Place' }
        ]
    },
    archstorming: {
        gallery: [
            { img: 'assets/images/competitions/SENEGAL SCHOOL_CROPPED_01.jpg', caption: 'Archstorming 2026 — Senegal Secondary School, Semi-Finalist' },
            { img: 'assets/images/competitions/SENEGAL SCHOOL_CROPPED_02.jpg', caption: 'Archstorming 2026 — Senegal Secondary School, Semi-Finalist' }
        ]
    },
    iida: {
        gallery: [
            { img: 'assets/images/competitions/GP1_04_Board_RenderingEntrance.jpg', caption: 'IIDA NY Student Design Awards 2015 — Winner' },
            { img: 'assets/images/competitions/GP1_05_Board_ConceptSection.jpg', caption: 'IIDA NY Student Design Awards 2015 — Winner' },
            { img: 'assets/images/competitions/GP1_06_Board_FloorPlan.jpg', caption: 'IIDA NY Student Design Awards 2015 — Winner' }
        ]
    },
    '188wsj': {
        img: 'assets/images/reference/188 St James Interview Deck_ Page 001.jpg',
        caption: '188 West Saint James — Cover'
    }
};

document.addEventListener('DOMContentLoaded', function() {
    var overlay = document.getElementById('popupOverlay');
    var popupMedia = document.getElementById('popupMedia');
    var popupImg = document.getElementById('popupImg');
    var popupCaption = document.getElementById('popupCaption');
    var popupCounter = document.getElementById('popupCounter');
    var popupPrev = document.getElementById('popupPrev');
    var popupNext = document.getElementById('popupNext');
    var galleryItems = null;
    var galleryIndex = 0;
    var galleryTimer = null;     // auto-advance interval id
    var galleryAutoMs = 0;       // auto-advance interval (0 = manual)
    // Shared zoom/pan state so the slideshow keeps the same zoom across slides.
    var zoomState = { scale: 1, tx: 0, ty: 0 };
    function resetZoomState() { zoomState.scale = 1; zoomState.tx = 0; zoomState.ty = 0; }

    function stopAuto() {
        if (galleryTimer) { clearInterval(galleryTimer); galleryTimer = null; }
    }
    function startAuto(ms) {
        stopAuto();
        galleryAutoMs = ms || 0;
        if (!galleryAutoMs || !galleryItems || galleryItems.length < 2) return;
        galleryTimer = setInterval(function() {
            // keep advancing even while zoomed; only hold during an active drag/pinch
            if (popupImg && popupImg._interacting) return;
            nextItem();
        }, galleryAutoMs);
    }
    function restartAuto() { if (galleryAutoMs) startAuto(galleryAutoMs); }

    function renderMedia(item) {
        popupMedia.innerHTML = '';
        if (item.vimeo) {
            var ifr = document.createElement('iframe');
            ifr.src = 'https://player.vimeo.com/video/' + item.vimeo + '?autoplay=1&loop=1&title=0&byline=0&portrait=0';
            ifr.allow = 'autoplay; fullscreen; picture-in-picture';
            ifr.setAttribute('allowfullscreen', '');
            ifr.setAttribute('frameborder', '0');
            ifr.className = 'popup-iframe';
            popupMedia.appendChild(ifr);
        } else if (item.video) {
            var v = document.createElement('video');
            v.src = item.video;
            v.autoplay = true; v.loop = true; v.controls = true; v.playsInline = true;
            v.className = 'popup-video';
            popupMedia.appendChild(v);
        } else {
            var img = document.createElement('img');
            img.id = 'popupImg';
            img.src = item.img;
            img.alt = item.caption || '';
            img.draggable = false;
            popupMedia.appendChild(img);
            popupImg = img;
            attachZoomPan(img);
        }
    }

    // Click-to-zoom + drag-to-pan (+ wheel zoom, pinch zoom) on the popup image.
    var ZOOM_LEVEL = 2.5;   // zoom factor applied on a plain click
    var MAX_ZOOM = 5.4;

    function attachZoomPan(img) {
        // Start from the shared state so an auto-advancing slideshow keeps its zoom.
        var scale = zoomState.scale, tx = zoomState.tx, ty = zoomState.ty;
        var pointers = {};
        var dragging = false, moved = false;
        var startX = 0, startY = 0, startTx = 0, startTy = 0;
        var pinchStartDist = 0, pinchStartScale = 1;
        // Per-image click-zoom level (data-zoom overrides the default).
        var clickZoom = parseFloat(img.getAttribute('data-zoom')) || ZOOM_LEVEL;
        // Fitted ("scale 1") pixel size of the image; measured once loaded.
        var baseW = 0, baseH = 0;

        function measureBase() {
            var w = img.style.width, h = img.style.height,
                mw = img.style.maxWidth, mh = img.style.maxHeight, tf = img.style.transform;
            img.style.width = ''; img.style.height = '';
            img.style.maxWidth = ''; img.style.maxHeight = ''; img.style.transform = 'none';
            baseW = img.offsetWidth; baseH = img.offsetHeight;
            img.style.width = w; img.style.height = h;
            img.style.maxWidth = mw; img.style.maxHeight = mh; img.style.transform = tf;
        }

        function apply() {
            if (scale > 1.01) {
                // Render at the zoomed pixel size so the browser samples the full-res
                // source (sharp). Take it out of flow (fixed, viewport-centered) so the
                // huge size doesn't balloon the popup layout; pan with translate.
                img.style.maxWidth = 'none';
                img.style.maxHeight = 'none';
                img.style.width = (baseW * scale) + 'px';
                img.style.height = (baseH * scale) + 'px';
                img.style.position = 'fixed';
                img.style.left = '50%';
                img.style.top = '50%';
                img.style.zIndex = '1';
                img.style.transform = 'translate(-50%,-50%) translate(' + tx + 'px,' + ty + 'px)';
            } else {
                // Back to the CSS-fitted size, in normal flow.
                img.style.width = '';
                img.style.height = '';
                img.style.maxWidth = '';
                img.style.maxHeight = '';
                img.style.position = '';
                img.style.left = '';
                img.style.top = '';
                img.style.zIndex = '';
                img.style.transform = '';
            }
            img._zoomed = scale > 1.01;
            img.classList.toggle('zoomed', img._zoomed);
            zoomState.scale = scale; zoomState.tx = tx; zoomState.ty = ty;
        }
        function reset() { scale = 1; tx = 0; ty = 0; apply(); }
        function clamp() {
            var maxX = Math.max(0, (baseW * scale - window.innerWidth) / 2);
            var maxY = Math.max(0, (baseH * scale - window.innerHeight) / 2);
            tx = Math.max(-maxX, Math.min(maxX, tx));
            ty = Math.max(-maxY, Math.min(maxY, ty));
        }
        function zoomTo(newScale, clientX, clientY) {
            if (!baseW) measureBase();
            newScale = Math.max(1, Math.min(MAX_ZOOM, newScale));
            var px = clientX - window.innerWidth / 2;
            var py = clientY - window.innerHeight / 2;
            var ratio = newScale / scale;
            tx = px - ratio * (px - tx);
            ty = py - ratio * (py - ty);
            scale = newScale;
            if (scale <= 1.01) { scale = 1; tx = 0; ty = 0; } else { clamp(); }
            apply();
        }

        var ids = function() { return Object.keys(pointers); };

        img.addEventListener('pointerdown', function(e) {
            e.stopPropagation();
            img._interacting = true;
            try { img.setPointerCapture(e.pointerId); } catch (_) {}
            pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
            var n = ids().length;
            if (n === 1) {
                dragging = true; moved = false;
                startX = e.clientX; startY = e.clientY; startTx = tx; startTy = ty;
                img.style.transition = 'none';
            } else if (n === 2) {
                dragging = false;
                var p = pointers[ids()[0]], q = pointers[ids()[1]];
                pinchStartDist = Math.hypot(p.x - q.x, p.y - q.y);
                pinchStartScale = scale;
                img.style.transition = 'none';
            }
        });

        img.addEventListener('pointermove', function(e) {
            if (!pointers[e.pointerId]) return;
            pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
            if (ids().length >= 2) {
                var p = pointers[ids()[0]], q = pointers[ids()[1]];
                var dist = Math.hypot(p.x - q.x, p.y - q.y);
                if (pinchStartDist > 0) {
                    zoomTo(pinchStartScale * (dist / pinchStartDist), (p.x + q.x) / 2, (p.y + q.y) / 2);
                }
                return;
            }
            if (!dragging) return;
            var dx = e.clientX - startX, dy = e.clientY - startY;
            if (Math.abs(dx) > 4 || Math.abs(dy) > 4) moved = true;
            if (scale > 1.01) { tx = startTx + dx; ty = startTy + dy; clamp(); apply(); }
        });

        function endPointer(e) {
            var wasDragging = dragging, hadMoved = moved;
            if (pointers[e.pointerId]) delete pointers[e.pointerId];
            try { img.releasePointerCapture(e.pointerId); } catch (_) {}
            if (ids().length === 0) { dragging = false; img._interacting = false; }
            // Plain tap (no drag) toggles zoom in/out at the click point.
            if (wasDragging && !hadMoved) {
                e.stopPropagation();
                if (scale > 1.01) { reset(); }
                else { zoomTo(clickZoom, e.clientX, e.clientY); }
            }
        }
        img.addEventListener('pointerup', endPointer);
        img.addEventListener('pointercancel', endPointer);

        img.addEventListener('wheel', function(e) {
            e.preventDefault();
            zoomTo(scale * (e.deltaY < 0 ? 1.2 : 1 / 1.2), e.clientX, e.clientY);
        }, { passive: false });

        // Measure the fitted size, then apply any inherited zoom (slideshow keeps
        // its zoom across slides). offsetWidth is 0 until the image has loaded.
        function init() {
            measureBase();
            if (scale > 1.01) { clamp(); }
            apply();
        }
        if (img.complete && img.naturalWidth) { init(); }
        else { img.addEventListener('load', init, { once: true }); }
    }

    function showGalleryItem(i) {
        galleryIndex = i;
        renderMedia(galleryItems[i]);
        popupCaption.textContent = galleryItems[i].caption || '';
        popupCounter.textContent = (i + 1) + ' / ' + galleryItems.length;
        popupPrev.style.display = galleryItems.length > 1 ? 'flex' : 'none';
        popupNext.style.display = galleryItems.length > 1 ? 'flex' : 'none';
    }

    function nextItem() {
        if (galleryItems && galleryItems.length > 1) {
            showGalleryItem((galleryIndex + 1) % galleryItems.length);
        }
    }

    function prevItem() {
        if (galleryItems && galleryItems.length > 1) {
            showGalleryItem((galleryIndex - 1 + galleryItems.length) % galleryItems.length);
        }
    }

    function closePopup() {
        stopAuto();
        galleryAutoMs = 0;
        overlay.classList.remove('active');
    }

    function openPopup(el) {
        var key = el.getAttribute('data-popup');
        var data = popupData[key];
        if (!data) return;
        if (data.gallery) {
            galleryItems = data.gallery;
        } else {
            galleryItems = [{ img: data.img, caption: data.caption }];
        }
        stopAuto(); galleryAutoMs = 0; resetZoomState();
        showGalleryItem(0);
        overlay.classList.add('active');
    }

    function openImage(src, caption) {
        if (!src) return;
        galleryItems = [{ img: src, caption: caption || '' }];
        stopAuto(); galleryAutoMs = 0; resetZoomState();
        showGalleryItem(0);
        overlay.classList.add('active');
    }

    function openGallery(items, autoMs) {
        if (!items || !items.length) return;
        galleryItems = items;
        resetZoomState();
        showGalleryItem(0);
        overlay.classList.add('active');
        startAuto(autoMs || 0);
    }

    function openVideo(src, caption) {
        if (!src) return;
        galleryItems = [{ video: src, caption: caption || '' }];
        stopAuto(); galleryAutoMs = 0; resetZoomState();
        showGalleryItem(0);
        overlay.classList.add('active');
    }

    // Marked on-slide videos -> open large in the popup player.
    document.querySelectorAll('video.video-zoom').forEach(function(vid) {
        vid.style.cursor = 'zoom-in';
        vid.addEventListener('click', function(e) {
            e.stopPropagation();
            var src = vid.getAttribute('data-src') || vid.getAttribute('src');
            if (!src) {
                var so = vid.querySelector('source');
                if (so) src = so.getAttribute('data-src') || so.getAttribute('src');
            }
            openVideo(src, vid.getAttribute('aria-label') || '');
        });
    });

    // Make standard slide images open a fullscreen, zoomable popup on click.
    // Direct children only — slideshows inside .slide-image are handled by .popup-gallery.
    document.querySelectorAll('.slide-image > img').forEach(function(img) {
        img.style.cursor = 'zoom-in';
        img.addEventListener('click', function(e) {
            e.stopPropagation();
            openImage(img.getAttribute('src'), img.getAttribute('alt') || '');
        });
    });

    // Individually marked images -> single zoomable popup.
    document.querySelectorAll('img.img-zoom').forEach(function(img) {
        img.style.cursor = 'zoom-in';
        img.addEventListener('click', function(e) {
            e.stopPropagation();
            openImage(img.getAttribute('src'), img.getAttribute('alt') || '');
        });
    });

    // Marked containers (e.g. auto-slide groups) -> open all their images as a
    // zoomable popup that keeps auto-advancing like the on-slide slideshow.
    document.querySelectorAll('.popup-gallery').forEach(function(box) {
        box.style.cursor = 'zoom-in';
        box.addEventListener('click', function(e) {
            e.stopPropagation();
            var items = Array.prototype.map.call(box.querySelectorAll('img'), function(im) {
                return { img: im.getAttribute('src'), caption: im.getAttribute('alt') || '' };
            });
            var ms = parseInt(box.getAttribute('data-interval'), 10) || 4000;
            openGallery(items, ms);
        });
    });
    document.querySelectorAll('.popup-trigger').forEach(function(el) {
        el.style.touchAction = 'manipulation';
        var touched = false;
        var sx = 0, sy = 0;
        el.addEventListener('touchstart', function(e) {
            var t = e.touches[0]; sx = t.clientX; sy = t.clientY; touched = true;
        }, {passive: true});
        el.addEventListener('touchend', function(e) {
            if (!touched) return;
            var t = e.changedTouches[0];
            if (Math.abs(t.clientX - sx) < 10 && Math.abs(t.clientY - sy) < 10) {
                e.preventDefault();
                e.stopPropagation();
                openPopup(el);
            }
            touched = false;
        });
        el.addEventListener('click', function(e) {
            e.stopPropagation();
            openPopup(el);
        });
    });

    popupPrev.addEventListener('click', function(e) {
        e.stopPropagation();
        prevItem();
        restartAuto();
    });
    popupNext.addEventListener('click', function(e) {
        e.stopPropagation();
        nextItem();
        restartAuto();
    });

    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) closePopup();
    });
    overlay.querySelector('.popup-close').addEventListener('click', closePopup);

    document.addEventListener('keydown', function(e) {
        if (!overlay.classList.contains('active')) return;
        if (e.key === 'Escape') closePopup();
        if (e.key === 'ArrowLeft') { prevItem(); restartAuto(); }
        if (e.key === 'ArrowRight') { nextItem(); restartAuto(); }
    });
});
