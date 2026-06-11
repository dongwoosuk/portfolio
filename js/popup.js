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
            popupMedia.appendChild(img);
            popupImg = img;
            img.addEventListener('click', function(e){ e.stopPropagation(); nextItem(); });
        }
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
        showGalleryItem(0);
        overlay.classList.add('active');
    }
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
    });
    popupNext.addEventListener('click', function(e) {
        e.stopPropagation();
        nextItem();
    });

    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) closePopup();
    });
    overlay.querySelector('.popup-close').addEventListener('click', closePopup);

    document.addEventListener('keydown', function(e) {
        if (!overlay.classList.contains('active')) return;
        if (e.key === 'Escape') closePopup();
        if (e.key === 'ArrowLeft') prevItem();
        if (e.key === 'ArrowRight') nextItem();
    });
});
