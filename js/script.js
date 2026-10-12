/* ==========================================================================
   KIVU PAX TV — Script principal
   Charge le contenu, gère le mode sombre, le menu mobile et la lightbox
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initMenu();
  initCounters();
  loadHomeArticles();
  loadHomeVideos();
  loadArticlesPage();
  loadVideosPage();
  loadPhotosPage();
  loadDocumentsPage();
  initLightbox();
});

/* ===== MODE SOMBRE / CLAIR ===== */
function initTheme() {
  const toggle = document.getElementById('themeToggle');
  const saved = localStorage.getItem('kpt-theme');

  if (saved) {
    document.documentElement.setAttribute('data-theme', saved);
  } else {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
  }

  if (toggle) {
    toggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('kpt-theme', next);
    });
  }
}

/* ===== MENU MOBILE ===== */
function initMenu() {
  const toggle = document.getElementById('menuToggle');
  const nav = document.getElementById('mainNav');
  if (!toggle || !nav) return;

  toggle.addEventListener('click', () => {
    nav.classList.toggle('open');
    toggle.textContent = nav.classList.contains('open') ? '✕' : '☰';
  });

  nav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      nav.classList.remove('open');
      toggle.textContent = '☰';
    });
  });

  document.addEventListener('click', (e) => {
    if (!nav.contains(e.target) && !toggle.contains(e.target) && nav.classList.contains('open')) {
      nav.classList.remove('open');
      toggle.textContent = '☰';
    }
  });
}

/* ===== COMPTEURS ANIMÉS ===== */
function initCounters() {
  const map = {
    statArticles: 'contenu/articles.json',
    statVideos: 'contenu/videos.json',
    statPhotos: 'contenu/photos.json',
    statDocuments: 'contenu/documents.json'
  };

  Object.entries(map).forEach(([id, path]) => {
    const el = document.getElementById(id);
    if (!el) return;

    fetch(path)
      .then(r => r.ok ? r.json() : {})
      .then(data => {
        const key = Object.keys(data)[0];
        const arr = Array.isArray(data[key]) ? data[key] : [];
        animateNumber(el, arr.length);
      })
      .catch(() => animateNumber(el, 0));
  });
}

function animateNumber(el, target) {
  let n = 0;
  if (target === 0) { el.textContent = '0'; return; }
  const step = Math.max(1, Math.ceil(target / 25));
  const timer = setInterval(() => {
    n += step;
    if (n >= target) { n = target; clearInterval(timer); }
    el.textContent = n;
  }, 40);
}

/* ===== UTILITAIRES ===== */
function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  } catch { return ''; }
}

function truncate(text, len = 140) {
  if (!text) return '';
  const clean = String(text).replace(/[#*_>`]/g, '').trim();
  return clean.length > len ? clean.slice(0, len) + '…' : clean;
}

function fetchJSON(path) {
  return fetch(path).then(r => r.ok ? r.json() : {}).catch(() => ({}));
}

function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ===== CARTE ARTICLE ===== */
function articleCard(a) {
  const safeImg = a.image ? escapeHTML(a.image) : '';
  const safeCat = a.category ? escapeHTML(a.category) : '';
  const safeTitle = escapeHTML(a.title || '');
  const safeUrl = a.url ? escapeHTML(a.url) : '#';
  return `
    <article class="card">
      <div class="card-media">
        ${safeImg ? `<img src="${safeImg}" alt="${safeTitle}" loading="lazy">` : ''}
        ${safeCat ? `<span class="card-category">${safeCat}</span>` : ''}
      </div>
      <div class="card-body">
        <p class="card-date">${formatDate(a.date)}</p>
        <h3>${safeTitle}</h3>
        <p>${escapeHTML(truncate(a.body, 140))}</p>
        <a href="${safeUrl}" class="card-link">Lire l'article →</a>
      </div>
    </article>
  `;
}

/* ===== CARTE VIDÉO ===== */
function videoCard(v) {
  const safeImg = v.thumbnail ? escapeHTML(v.thumbnail) : '';
  const safeTitle = escapeHTML(v.title || '');
  const safeUrl = v.url ? escapeHTML(v.url) : '#';
  return `
    <article class="card">
      <div class="card-media">
        ${safeImg ? `<img src="${safeImg}" alt="${safeTitle}" loading="lazy">` : ''}
        <div class="video-play"></div>
      </div>
      <div class="card-body">
        <p class="card-date">${formatDate(v.date)}</p>
        <h3>${safeTitle}</h3>
        <p>${escapeHTML(truncate(v.description, 140))}</p>
        <a href="${safeUrl}" class="card-link" target="_blank" rel="noopener">Regarder →</a>
      </div>
    </article>
  `;
}

/* ===== ACCUEIL — ARTICLES ===== */
function loadHomeArticles() {
  const el = document.getElementById('homeArticles');
  if (!el) return;

  fetchJSON('contenu/articles.json').then(d => {
    const arr = Array.isArray(d.articles) ? d.articles : [];
    el.innerHTML = arr.length
      ? arr.slice(0, 3).map(articleCard).join('')
      : '<p class="empty-msg">Aucun article publié pour le moment.</p>';
  });
}

/* ===== ACCUEIL — VIDÉOS ===== */
function loadHomeVideos() {
  const el = document.getElementById('homeVideos');
  if (!el) return;

  fetchJSON('contenu/videos.json').then(d => {
    const arr = Array.isArray(d.videos) ? d.videos : [];
    el.innerHTML = arr.length
      ? arr.slice(0, 3).map(videoCard).join('')
      : '<p class="empty-msg">Aucune vidéo publiée pour le moment.</p>';
  });
}

/* ===== PAGE ARTICLES ===== */
function loadArticlesPage() {
  const el = document.getElementById('liste-articles');
  if (!el) return;

  fetchJSON('contenu/articles.json').then(d => {
    const arr = Array.isArray(d.articles) ? d.articles : [];

    if (!arr.length) {
      el.innerHTML = '<p class="empty-msg">Aucun article publié pour le moment.</p>';
      return;
    }

    el.innerHTML = arr.map(articleCard).join('');

    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const f = btn.dataset.filter;

        const filtered = (f === 'all')
          ? arr
          : arr.filter(a => (a.category || '').toLowerCase().includes(f));

        el.innerHTML = filtered.length
          ? filtered.map(articleCard).join('')
          : '<p class="empty-msg">Aucun article dans cette catégorie.</p>';
      });
    });
  });
}

/* ===== PAGE VIDÉOS ===== */
function loadVideosPage() {
  const el = document.getElementById('liste-videos');
  if (!el) return;

  fetchJSON('contenu/videos.json').then(d => {
    const arr = Array.isArray(d.videos) ? d.videos : [];
    el.innerHTML = arr.length
      ? arr.map(videoCard).join('')
      : '<p class="empty-msg">Aucune vidéo publiée pour le moment.</p>';
  });
}

/* ===== PAGE PHOTOS ===== */
function loadPhotosPage() {
  const el = document.getElementById('liste-photos');
  if (!el) return;

  fetchJSON('contenu/photos.json').then(d => {
    const arr = Array.isArray(d.photos) ? d.photos : [];

    if (!arr.length) {
      el.innerHTML = '<p class="empty-msg">Aucune photo publiée pour le moment.</p>';
      return;
    }

    el.innerHTML = arr.map((p, i) => `
      <div class="photo-item" data-index="${i}">
        <img src="${escapeHTML(p.image)}" alt="${escapeHTML(p.title || '')}" loading="lazy">
        <div class="photo-overlay"><p>${escapeHTML(p.title || '')}</p></div>
      </div>
    `).join('');

    el._photos = arr;
  });
}

/* ===== LIGHTBOX ===== */
function initLightbox() {
  const lb = document.getElementById('lightbox');
  if (!lb) return;

  const img = document.getElementById('lightboxImg');
  const caption = document.getElementById('lightboxCaption');
  const close = document.getElementById('lightboxClose');

  document.addEventListener('click', (e) => {
    const item = e.target.closest('.photo-item');
    if (item) {
      const grid = document.getElementById('liste-photos');
      const data = grid && grid._photos;
      if (!data) return;

      const photo = data[item.dataset.index];
      if (!photo) return;

      img.src = photo.image;
      caption.textContent = photo.title || '';
      lb.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  });

  const closeLightbox = () => {
    lb.classList.remove('open');
    document.body.style.overflow = '';
  };

  if (close) close.addEventListener('click', closeLightbox);
  lb.addEventListener('click', (e) => { if (e.target === lb) closeLightbox(); });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeLightbox();
  });
}

/* ===== PAGE DOCUMENTS ===== */
function loadDocumentsPage() {
  const el = document.getElementById('liste-documents');
  if (!el) return;

  fetchJSON('contenu/documents.json').then(d => {
    const arr = Array.isArray(d.documents) ? d.documents : [];

    if (!arr.length) {
      el.innerHTML = '<p class="empty-msg">Aucun document disponible pour le moment.</p>';
      return;
    }

    el.innerHTML = arr.map(doc => `
      <div class="doc-item">
        <div class="doc-icon">📄</div>
        <div class="doc-info">
          <h3>${escapeHTML(doc.title || '')}</h3>
          <p>${escapeHTML(doc.description || '')}${doc.size ? ' — ' + escapeHTML(doc.size) : ''}</p>
        </div>
        <a href="${escapeHTML(doc.file || '#')}" class="doc-download" download>Télécharger</a>
      </div>
    `).join('');
  });
}