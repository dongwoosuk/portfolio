// Popup data + gallery logic
var popupData = {
    pavilion: {
        img: 'assets/images/career/the-exchange.jpg',
        caption: 'The Exchange — Miller Prize Winning Pavilion, Exhibit Columbus (Oyler Wu Collaborative)'
    },
    exhibition: {
        img: 'assets/images/career/quicksilver.jpg',
        caption: 'Quicksilver Installation — JUT Art Museum, Taipei (Oyler Wu Collaborative)'
    },
    exchange: {
        img: 'assets/images/career/the-exchange.jpg',
        caption: 'The Exchange — Miller Prize + MCHAP Selected, Exhibit Columbus (Oyler Wu Collaborative)'
    },
    ellore: {
        img: 'assets/images/career/ellore.jpg',
        caption: 'Ellore — Senior Living Community, Gold Nugget Grand Award (Steinberg Hart)'
    },
    clara: {
        img: 'assets/images/career/the-clara.jpg',
        caption: 'The Clara — Mixed-Use Residential, SVBJ Structures Award (Steinberg Hart)'
    },
    '188wsj': {
        gallery: [
            { img: 'assets/images/reference/188 St James Interview Deck_ Page 001.jpg', caption: '188 West Saint James — Cover' },
            { img: 'assets/images/reference/188 WSJ_V01-Lobby.jpg', caption: '188 West Saint James — Lobby' },
            { img: 'assets/images/reference/188 WSJ_V02-Owners Lounge1.jpg', caption: '188 West Saint James — Owners Lounge 1' },
            { img: 'assets/images/reference/188 WSJ_V02-Owners Lounge2.jpg', caption: '188 West Saint James — Owners Lounge 2' },
            { img: 'assets/images/reference/188 WSJ_V04-Activity deck.jpg', caption: '188 West Saint James — Activity Deck' },
            { img: 'assets/images/reference/188 WSJ_V05-Pool Deck.jpg', caption: '188 West Saint James — Pool Deck' },
            { img: 'assets/images/reference/188 WSJ_V06-Pool Bar.jpg', caption: '188 West Saint James — Pool Bar' }
        ]
    }
};

document.addEventListener('DOMContentLoaded', function() {
    var overlay = document.getElementById('popupOverlay');
    var popupImg = document.getElementById('popupImg');
    var popupCaption = document.getElementById('popupCaption');
    var popupCounter = document.getElementById('popupCounter');
    var popupPrev = document.getElementById('popupPrev');
    var popupNext = document.getElementById('popupNext');
    var galleryItems = null;
    var galleryIndex = 0;

    function showGalleryItem(i) {
        galleryIndex = i;
        popupImg.src = galleryItems[i].img;
        popupImg.alt = galleryItems[i].caption;
        popupCaption.textContent = galleryItems[i].caption;
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

    document.querySelectorAll('.popup-trigger').forEach(function(el) {
        el.addEventListener('click', function(e) {
            e.stopPropagation();
            var key = this.getAttribute('data-popup');
            var data = popupData[key];
            if (!data) return;
            if (data.gallery) {
                galleryItems = data.gallery;
            } else {
                galleryItems = [{ img: data.img, caption: data.caption }];
            }
            showGalleryItem(0);
            overlay.classList.add('active');
        });
    });

    popupImg.addEventListener('click', function(e) {
        e.stopPropagation();
        nextItem();
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
