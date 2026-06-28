/* artist-detail.js — Load and display artist details */

(function () {
  "use strict";

  const artistNameEl = document.getElementById('artistName');
  const artistDateEl = document.getElementById('artistDate');
  const artistPlaceEl = document.getElementById('artistPlace');
  const artistBioEl = document.getElementById('artistBio');
  const artistImageEl = document.getElementById('artistImage');
  const tagsContainer = document.getElementById('tagsContainer');
  const imgPlaceholder = document.getElementById('imgPlaceholder');
  const bioBlock = document.querySelector('.bio-block');
  const readMoreBtn = document.getElementById('readMoreBtn');
  const interviewSection = document.getElementById('artistInterviewSection');
  const interviewFrame = document.getElementById('artistInterviewFrame');
  const artworksSection = document.getElementById('artworksSection');
  const artworksGrid = document.getElementById('artworksGrid');
  const artworkModal = document.getElementById('artworkModal');
  const modalBackdrop = document.getElementById('artworkModalBackdrop');
  const modalPrevBtn = document.getElementById('modalPrevBtn');
  const modalNextBtn = document.getElementById('modalNextBtn');
  const modalArtworkCount = document.getElementById('modalArtworkCount');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const modalArtworkImage = document.getElementById('modalArtworkImage');
  const modalArtistName = document.getElementById('modalArtistName');
  const modalArtistMeta = document.getElementById('modalArtistMeta');
  const modalArtworkTitle = document.getElementById('modalArtworkTitle');
  const modalArtworkDate = document.getElementById('modalArtworkDate');
  const modalArtworkLines = document.getElementById('modalArtworkLines');
  const modalArtworkAcquisition = document.getElementById('modalArtworkAcquisition');
  const modalArtworkCollection = document.getElementById('modalArtworkCollection');
  const backToCartographyLink = document.getElementById('backToCartographyLink');

  let currentArtworks = [];
  let currentArtistProfile = null;
  let currentArtworkIndex = -1;

  function updateBioToggleVisibility() {
    if (!readMoreBtn || !artistBioEl || !bioBlock) return;

    bioBlock.classList.remove('is-expanded');
    readMoreBtn.textContent = 'Read full biography';

    // Delay so layout can update after dynamic text insertion.
    requestAnimationFrame(() => {
      const hasOverflow = artistBioEl.scrollHeight > artistBioEl.clientHeight + 1;
      readMoreBtn.style.display = hasOverflow ? 'inline-flex' : 'none';
    });
  }

  // Get artist name from URL query parameter
  function getArtistName() {
    const params = new URLSearchParams(window.location.search);
    return params.get('name');
  }

  function getArtistId() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
  }

  function normalizeName(value) {
    return (value || '')
      .toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
  }

  function splitArtistNames(value) {
    return (value || '')
      .toString()
      .split(',')
      .map(name => normalizeName(name))
      .filter(Boolean);
  }

  function getRecordAuthor(record) {
    return (
      record['Author(s)'] ||
      record['All the authors of the links'] ||
      record['All the authors of the links'] ||
      record['Auteur(s)'] ||
      record['Tous les auteur(s) des liées'] ||
      ''
    );
  }

  function toImagePath(path) {
    const raw = (path || '').toString().trim();
    if (!raw) return '';
    if (/^https?:\/\//i.test(raw) || raw.startsWith('./') || raw.startsWith('/')) {
      return raw;
    }
    return `./${raw}`;
  }

  function textOrEmpty(value) {
    const text = (value || '').toString().trim();
    return text && text !== 'Unknown' ? text : '';
  }

  function getEmbedVideoUrl(rawUrl) {
    const value = (rawUrl || '').toString().trim();
    if (!value) return '';

    try {
      const url = new URL(value);
      const host = url.hostname.toLowerCase();

      if (host.includes('youtu.be')) {
        const id = url.pathname.replace('/', '').trim();
        return id ? `https://www.youtube-nocookie.com/embed/${id}?rel=0` : '';
      }

      if (host.includes('youtube.com') || host.includes('youtube-nocookie.com')) {
        if (url.pathname.startsWith('/embed/')) {
          return value;
        }

        const id = url.searchParams.get('v');
        return id ? `https://www.youtube-nocookie.com/embed/${id}?rel=0` : '';
      }

      if (host.includes('vimeo.com')) {
        const id = url.pathname.split('/').filter(Boolean)[0];
        return id ? `https://player.vimeo.com/video/${id}` : '';
      }
    } catch (error) {
      return '';
    }

    return '';
  }

  function renderInterviewSection(artistData, artistDisplayName) {
    if (!interviewSection || !interviewFrame) return;

    const normalizedName = normalizeName(artistDisplayName);
    const isMarilena = normalizedName.includes('marilena pelosi');

    if (!isMarilena) {
      interviewSection.hidden = true;
      interviewFrame.src = '';
      return;
    }

    const videoValue = textOrEmpty(artistData?.['Video']) || 'https://youtu.be/lYT_ClPwgm4';
    const embedUrl = getEmbedVideoUrl(videoValue) || 'https://www.youtube-nocookie.com/embed/lYT_ClPwgm4?rel=0';

    interviewFrame.src = embedUrl;
    interviewSection.hidden = false;
  }

  function closeArtworkModal() {
    if (!artworkModal) return;
    artworkModal.classList.remove('is-open');
    artworkModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function updateArtworkNavigation() {
    const total = currentArtworks.length;
    if (modalArtworkCount) {
      if (total > 0 && currentArtworkIndex >= 0) {
        modalArtworkCount.textContent = `${currentArtworkIndex + 1} / ${total}`;
      } else {
        modalArtworkCount.textContent = '';
      }
    }

    if (!modalPrevBtn || !modalNextBtn) return;
    const hasMany = total > 1;
    modalPrevBtn.style.display = hasMany ? 'flex' : 'none';
    modalNextBtn.style.display = hasMany ? 'flex' : 'none';
    modalPrevBtn.disabled = false;
    modalNextBtn.disabled = false;
  }

  function renderModalArtwork(index) {
    if (!currentArtworks.length) return;
    const safeIndex = Math.max(0, Math.min(index, currentArtworks.length - 1));
    const artwork = currentArtworks[safeIndex];
    if (!artwork) return;

    currentArtworkIndex = safeIndex;

    const imageSrc = toImagePath(artwork['Image']);
    const title = textOrEmpty(artwork['Title']) || textOrEmpty(artwork['Title of the set']) || 'Untitled';
    const date = textOrEmpty(artwork['Date of creation']) || textOrEmpty(artwork['Date']) || '';
    const materials = textOrEmpty(artwork['Materials, supports, techniques']);
    const dimensions = textOrEmpty(artwork['Dimensions']) || textOrEmpty(artwork['Additional dimensions']);
    const printRun = textOrEmpty(artwork['Print run']);
    const domain = textOrEmpty(artwork['Domain, name']);
    const description = textOrEmpty(artwork['Description']);
    const acquisition = textOrEmpty(artwork['Acquisition']);
    const collection = textOrEmpty(artwork['Collection']);

    const artistName = currentArtistProfile?.name || textOrEmpty(artwork['Author(s)']) || 'Artist';
    const artistBirth = currentArtistProfile?.date || textOrEmpty(artwork['Birth / death']);
    const artistPlace = currentArtistProfile?.place || textOrEmpty(artwork['Lives / Works']);

    modalArtworkImage.src = imageSrc;
    modalArtworkImage.alt = title;
    modalArtistName.textContent = artistName;
    modalArtistMeta.textContent = [artistBirth, artistPlace].filter(Boolean).join(' - ');
    modalArtworkTitle.textContent = title;
    modalArtworkDate.textContent = date;

    const lines = [materials, dimensions, printRun ? `Tirage : ${printRun}` : '', domain, description].filter(Boolean);
    modalArtworkLines.innerHTML = lines.map(line => `<p>${line}</p>`).join('');
    modalArtworkAcquisition.textContent = acquisition;
    modalArtworkCollection.textContent = collection;

    updateArtworkNavigation();
  }

  function openArtworkModal(index) {
    if (!artworkModal || !currentArtworks.length) return;

    renderModalArtwork(index);

    artworkModal.classList.add('is-open');
    artworkModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function showPreviousArtwork() {
    if (!currentArtworks.length) return;
    const nextIndex = currentArtworkIndex > 0 ? currentArtworkIndex - 1 : currentArtworks.length - 1;
    renderModalArtwork(nextIndex);
  }

  function showNextArtwork() {
    if (!currentArtworks.length) return;
    const nextIndex = currentArtworkIndex < currentArtworks.length - 1 ? currentArtworkIndex + 1 : 0;
    renderModalArtwork(nextIndex);
  }

  function renderArtworks(artworks) {
    if (!artworksGrid || !artworksSection) return;

    currentArtworks = artworks.filter(artwork => toImagePath(artwork['Image']));

    if (!currentArtworks.length) {
      artworksGrid.innerHTML = '';
      artworksSection.hidden = true;
      return;
    }

    artworksGrid.innerHTML = currentArtworks
      .map((artwork, index) => {
        const src = toImagePath(artwork['Image']);
        const title = (artwork['Title'] || artwork['Title of the set'] || 'Artwork').toString().trim();
        if (!src) return '';
        return `<figure class="artwork-card" data-index="${index}"><img src="${src}" alt="${title.replace(/"/g, '&quot;')}" loading="lazy" onerror="this.closest('figure') && this.closest('figure').remove()"></figure>`;
      })
      .join('');

    artworksSection.hidden = false;
  }

  function getMatchedArtworks(artistData, artworksData) {
    const queryId = (getArtistId() || '').trim();
    const artistId = (artistData?.ID || artistData?.Id || artistData?.id || '').toString().trim();
    const idCandidates = new Set([queryId, artistId].filter(Boolean));

    let matched = [];

    // First, try ID matching
    if (idCandidates.size) {
      const byId = artworksData.filter(item => idCandidates.has((item?.ID || item?.Id || item?.id || '').toString().trim()));
      if (byId.length) {
        matched = matched.concat(byId);
      }
    }

    // Always try name matching to find additional artworks
    const nameCandidates = new Set([
      ...splitArtistNames(artistData?.['Artist']),
      normalizeName(getArtistName())
    ].filter(Boolean));

    const byName = artworksData.filter(item => {
      const authors = splitArtistNames(getRecordAuthor(item));
      if (!authors.length) return false;
      return authors.some(author => nameCandidates.has(author));
    });

    matched = matched.concat(byName);

    // Deduplicate by ID+Image combination
    const seen = new Set();
    return matched.filter(item => {
      const key = `${item?.ID || ''}|${item?.Image || ''}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  // Load and display artist data
  function loadArtistData() {
    const artistName = getArtistName();

    if (!artistName) {
      artistNameEl.textContent = 'Artist not found';
      return;
    }

    Promise.all([
      fetch('./assets/artists.json').then(res => res.json()),
      fetch('./assets/Artworks.json').then(res => res.json())
    ])
      .then(([artistsData, artworksData]) => {
        // Find the artist by name
        const searchName = normalizeName(artistName);

        let artistData = artistsData.find(item => {
          return normalizeName(item['Artist']) === searchName;
        });

        if (!artistData) {
          artistData = artistsData.find(item => {
            const parts = splitArtistNames(item['Artist']);
            return parts.includes(searchName);
          });
        }

        if (!artistData) {
          artistNameEl.textContent = 'Artist not found';
          renderInterviewSection(null, '');
          renderArtworks([]);
          return;
        }

        // Populate the page with artist data
        const name = (artistData['Artist'] || 'Unknown').trim();
        const date = (artistData['Birth / death'] || 'Unknown').trim();
        const place = (artistData['Lives / Works'] || 'Unknown').trim();
        const nationality = (artistData['Nationality'] || 'Unknown').trim();
        const image = (artistData['Image'] || '').trim();
        const description = (artistData['Biography'] || 'No biography available.').trim();

        currentArtistProfile = {
          name,
          date,
          place
        };

        // Update title
        document.title = `${name} — Women Artists from the Global South`;

        // Update text content
        artistNameEl.textContent = name;
        artistDateEl.textContent = date;
        artistPlaceEl.textContent = place;
        artistBioEl.innerHTML = description
          .split(/\n\s*\n/)
          .map(paragraph => `<p>${paragraph.trim()}</p>`)
          .join('');
        updateBioToggleVisibility();
        renderInterviewSection(artistData, name);

        // Update image
        if (image && image !== 'Unknown') {
          artistImageEl.src = image;
          artistImageEl.style.display = 'block';
          imgPlaceholder.style.display = 'none';
        } else {
          artistImageEl.style.display = 'none';
          imgPlaceholder.style.display = 'flex';
        }

        // Populate tags
        tagsContainer.innerHTML = '';
        
        // Add nationality tag
        if (nationality && nationality !== 'Unknown') {
          const tag = document.createElement('div');
          tag.className = 'tag tag--yellow';
          tag.innerHTML = `<span>${nationality.toUpperCase()}</span>`;
          tagsContainer.appendChild(tag);
        }

        const matchedArtworks = getMatchedArtworks(artistData, artworksData || []);
        renderArtworks(matchedArtworks);
      })
      .catch(error => {
        console.error('Error loading artist data:', error);
        artistNameEl.textContent = 'Error loading artist data';
        updateBioToggleVisibility();
        renderInterviewSection(null, '');
        renderArtworks([]);
      });
  }

  // Initialize
  loadArtistData();

  if (backToCartographyLink) {
    backToCartographyLink.addEventListener('click', (event) => {
      event.preventDefault();
      // Prefer browser history so previous cartography state is restored.
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.location.href = 'cartography.html';
      }
    });
  }

  if (artworksGrid) {
    artworksGrid.addEventListener('click', (event) => {
      const card = event.target.closest('.artwork-card');
      if (!card) return;
      const index = Number(card.getAttribute('data-index'));
      if (!Number.isNaN(index)) {
        openArtworkModal(index);
      }
    });
  }

  [modalBackdrop, modalCloseBtn].forEach(el => {
    if (el) el.addEventListener('click', closeArtworkModal);
  });

  if (modalPrevBtn) {
    modalPrevBtn.addEventListener('click', showPreviousArtwork);
  }

  if (modalNextBtn) {
    modalNextBtn.addEventListener('click', showNextArtwork);
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeArtworkModal();
      return;
    }

    if (!artworkModal || !artworkModal.classList.contains('is-open')) return;

    if (event.key === 'ArrowLeft') {
      showPreviousArtwork();
    } else if (event.key === 'ArrowRight') {
      showNextArtwork();
    }
  });

  // Handle "Read full biography" button
  if (readMoreBtn) {
    readMoreBtn.addEventListener('click', () => {
      if (!bioBlock) return;
      const expanded = bioBlock.classList.toggle('is-expanded');
      readMoreBtn.textContent = expanded ? 'Show less biography' : 'Read full biography';
    });
  }
})();
