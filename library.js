const artistGrid = document.getElementById('artistGrid');
const filterControls = document.getElementById('filterControls');
const artistCount = document.getElementById('artistCount');
const activeFiltersLabel = document.getElementById('activeFilters');
const categoryButtons = Array.from(document.querySelectorAll('.filter-category'));
const categoryBar = document.getElementById('categoryBar');

let artists = [];
let currentCategory = 'country';

const categoryLabels = {
    country: 'Country',
    medium: 'Medium',
    genre: 'Genre',
    place: 'Lives/Works',
    decade: 'Decade',
    organisation: 'Organisation'
};

const categoryFieldMap = {
    country: 'Nationalité',
    medium: 'Domaine, dénomination',
    genre: 'Mots-clés mouvement',
    place: 'Vit / travaille',
    decade: 'Date de création',
    organisation: 'Collection'
};

const selectedFiltersByCategory = {
    country: new Set(),
    medium: new Set(),
    genre: new Set(),
    place: new Set(),
    decade: new Set(),
    organisation: new Set()
};

// Sidebar / popover pagination state
let sidebarState = { category: null, page: 1, pageSize: 24 };

function normalizeText(value) {
    if (!value || !value.toString().trim()) {
        return 'Unknown';
    }
    return value.toString().trim();
}

// Replace failing images with a placeholder div
function handleImageError(img) {
    try {
        if (img.getAttribute('data-error-handled') === 'true') return;
        img.setAttribute('data-error-handled', 'true');
        const parent = img.parentElement;
        if (!parent) return;
        const fallback = document.createElement('div');
        fallback.className = 'no-image-placeholder';
        fallback.textContent = 'No Image';
        // remove image if still present
        if (parent.contains(img)) parent.removeChild(img);
        parent.appendChild(fallback);
    } catch (e) {
        console.error('handleImageError', e);
    }
}

function handleProfileClick(e) {
    e.stopPropagation();
    const btn = e.currentTarget;
    const card = btn.closest('.artist-card');
    let name = 'Artist';
    if (card) {
        const nameEl = card.querySelector('.artist-name');
        if (nameEl) name = nameEl.innerText;
    }
    alert(`Viewing profile: ${name}`);
}

function setupArtistCardInteractions() {
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.removeEventListener('click', handleProfileClick);
        btn.addEventListener('click', handleProfileClick);
    });
}

function loadData() {
    fetch('./assets/data.json')
        .then(res => res.json())
        .then(data => {
            artists = data.map(item => ({
                name: normalizeText(item['Auteur(s)'] || item['Tous les auteur(s) des liées']),
                nationality: normalizeText(item['Nationalité']),
                place: normalizeText(item['Vit / travaille'] || item['Lieu de réalisation'] || item['Naissance / décès']),
                date: normalizeText(item['Date de création'] || item['Naissance / décès'] || item['Naissance / décès']),
                medium: normalizeText(item['Domaine, dénomination'] || item['Domaine']),
                image: normalizeText(item['image']),
                source: item
            }));

            // Deduplicate artists by normalized name (keep first occurrence)
            const seen = new Set();
            artists = artists.filter(a => {
                const key = (a.name || '').toLowerCase().trim();
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            });

            renderCategoryButtons();
            renderArtistCards(artists);
            updateFooter(artists.length, []);
        })
        .catch(error => {
            console.error('Unable to load artist data:', error);
            artistGrid.innerHTML = '<div class="loading-error">Unable to load the library data.</div>';
        });
}

function getUniqueValues(category) {
    const field = categoryFieldMap[category];
    const values = new Set();

    artists.forEach(artist => {
        const raw = normalizeText(artist.source[field]);
        if (raw && raw !== 'Unknown') {
            values.add(raw);
        }
    });

    return Array.from(values).sort((a, b) => a.localeCompare(b));
}

// --- Search suggestion helpers ---
function getAllKeywords() {
    const set = new Set();
    artists.forEach(a => {
        if (a.name && a.name !== 'Unknown') set.add(a.name);
        if (a.nationality && a.nationality !== 'Unknown') set.add(a.nationality);
        if (a.place && a.place !== 'Unknown') set.add(a.place);
        if (a.medium && a.medium !== 'Unknown') {
            a.medium.toString().split(',').forEach(m => { if (m && m.trim()) set.add(m.trim()); });
        }
    });
    return Array.from(set);
}

function updateSearchSuggestions(query) {
    const container = document.getElementById('searchSuggestions');
    if (!container) return;
    if (!query || !query.trim()) { container.classList.add('hidden'); container.innerHTML = ''; return; }
    const q = query.toLowerCase();
    const keywords = getAllKeywords();
    const matches = keywords.filter(k => k.toLowerCase().startsWith(q)).slice(0, 12);
    if (!matches.length) { container.classList.add('hidden'); container.innerHTML = ''; return; }
    container.innerHTML = matches.map(m => `<div class="suggestion-item" data-val="${m.replace(/"/g, '&quot;')}">${m}</div>`).join('');
    container.classList.remove('hidden');
    container.querySelectorAll('.suggestion-item').forEach(item => {
        item.addEventListener('click', () => {
            const val = item.getAttribute('data-val');
            const input = document.getElementById('compactSearchInput');
            if (input) input.value = val;
            searchQuery = val;
            updateUI();
            container.classList.add('hidden');
        });
    });
}

function renderCategoryButtons() {
    categoryButtons.forEach(button => {
        const cat = button.dataset.filter;
        const badge = button.querySelector('.count');
        // show number of selected filters for each category (hide when zero)
        const selectedCount = selectedFiltersByCategory[cat] ? selectedFiltersByCategory[cat].size : 0;
        if (badge) {
            badge.textContent = selectedCount ? selectedCount : '';
            badge.style.display = selectedCount ? 'inline-flex' : 'none';
        }
    });
}

function renderFilterOptions(category, showPopover = true) {
    const filterValues = getUniqueValues(category);
    const activeSet = selectedFiltersByCategory[category];

    let headerText = `Select ${categoryLabels[category] || category}`;

    if (!filterValues.length) {
        filterControls.innerHTML = `
            <div class="popover-header">
                <div class="popover-title">${headerText}</div>
                <div class="popover-actions">
                    <button id="closeFilters" type="button">Close</button>
                </div>
            </div>
            <div class="filter-empty">No filters available.</div>
        `;
        filterControls.classList.toggle('hidden', !showPopover);
        attachPopoverActionHandlers(category);
        return;
    }

    // pagination for long lists
    const pageSize = sidebarState.pageSize;
    const totalPages = Math.max(1, Math.ceil(filterValues.length / pageSize));
    if (sidebarState.category !== category) { sidebarState.category = category; sidebarState.page = 1; }
    const page = Math.min(Math.max(1, sidebarState.page), totalPages);
    const start = (page - 1) * pageSize;
    const pageValues = filterValues.slice(start, start + pageSize);

    filterControls.innerHTML = `
        <div class="popover-header">
            <div class="popover-title">${headerText}</div>
            <button id="selectAll" class="select-all-btn" type="button">Select All</button>
        </div>
        <div class="filter-list options-grid" id="filterListGrid">
            ${pageValues
                .map(value => {
                    const safeValue = value.replace(/"/g, '&quot;');
                    const checked = activeSet.has(value) ? 'checked' : '';
                    return `
                        <label class="filter-option checkbox-label">
                            <input type="checkbox" value="${safeValue}" ${checked} />
                            <span class="custom-checkbox ${checked ? 'checked' : ''}"><svg class="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg></span>
                            <span>${value}</span>
                        </label>
                    `;
                })
                .join('')}
        </div>
        <div class="filter-actions">
            <div id="paginationContainer" style="flex:1"></div>
            <div style="display:flex;gap:12px"><button id="clearFilters" class="clear-btn" type="button">Clear</button><button id="applyFilters" type="button" class="confirm-btn">Confirm</button></div>
        </div>
    `;

    // pagination controls
    const pagContainer = document.getElementById('paginationContainer');
    if (pagContainer) {
        if (totalPages > 1) {
            pagContainer.innerHTML = `<div style="display:flex;align-items:center;gap:8px;"><button id="pagPrev" class="clear-btn">◀</button><span style="font-size:13px;color:rgba(255,255,255,0.8);">Page ${page} / ${totalPages}</span><button id="pagNext" class="confirm-btn">▶</button></div>`;
            const prevBtn = document.getElementById('pagPrev');
            const nextBtn = document.getElementById('pagNext');
            prevBtn?.addEventListener('click', (ev) => { ev.stopPropagation(); sidebarState.page = Math.max(1, sidebarState.page - 1); renderFilterOptions(category, true); });
            nextBtn?.addEventListener('click', (ev) => { ev.stopPropagation(); sidebarState.page = Math.min(totalPages, sidebarState.page + 1); renderFilterOptions(category, true); });
            // also guard pointerdown/touch to prevent outside-click handlers
            prevBtn?.addEventListener('pointerdown', (ev) => ev.stopPropagation());
            nextBtn?.addEventListener('pointerdown', (ev) => ev.stopPropagation());
        } else {
            pagContainer.innerHTML = '';
        }
    }

    filterControls.classList.toggle('hidden', !showPopover);
    attachFilterCheckboxHandlers(category);
    attachPopoverActionHandlers(category);

    // show backdrop
    const backdrop = document.getElementById('filterBackdrop');
    if (backdrop) backdrop.classList.add('visible');

    // position below the category bar
    const bar = document.getElementById('categoryBar');
    const sidebarEl = filterControls;
    if (bar && sidebarEl) {
        const rect = bar.getBoundingClientRect();
        const top = rect.bottom + window.scrollY;
        sidebarEl.style.position = 'absolute';
        sidebarEl.style.top = top + 'px';
        sidebarEl.style.left = '1rem';
        sidebarEl.style.right = '1rem';
        sidebarEl.style.maxWidth = '1400px';
        sidebarEl.style.margin = '0 auto';
        sidebarEl.style.zIndex = 1050;
    }
}

function attachFilterCheckboxHandlers(category) {
    const activeSet = selectedFiltersByCategory[category];

    filterControls.querySelectorAll('input[type="checkbox"]').forEach(input => {
        input.addEventListener('change', () => {
            if (input.checked) {
                activeSet.add(input.value);
            } else {
                activeSet.delete(input.value);
            }
            applyFilters();
            renderCategoryButtons();
        });
    });
}

function attachPopoverActionHandlers(category) {
    const selectedSet = selectedFiltersByCategory[category];

    const selectAllButton = document.getElementById('selectAll');
    const clearFiltersButton = document.getElementById('clearFilters');
    const applyFiltersButton = document.getElementById('applyFilters');

    if (selectAllButton) {
        selectAllButton.addEventListener('click', (ev) => {
            ev.stopPropagation();
            filterControls.querySelectorAll('input[type="checkbox"]').forEach(input => {
                input.checked = true;
                selectedSet.add(input.value);
            });
            applyFilters();
            renderCategoryButtons();
        });
    }

    if (clearFiltersButton) {
        clearFiltersButton.addEventListener('click', (ev) => {
            ev.stopPropagation();
            selectedSet.clear();
            filterControls.querySelectorAll('input[type="checkbox"]').forEach(input => {
                input.checked = false;
            });
            applyFilters();
            renderCategoryButtons();
        });
    }

    if (applyFiltersButton) {
        applyFiltersButton.addEventListener('click', (ev) => {
            ev.stopPropagation();
            closeFilterPopover();
        });
    }
}

function closeFilterPopover() {
    filterControls.classList.add('hidden');
}

function openFilterPopover(category) {
    currentCategory = category;
    categoryButtons.forEach(button => {
        button.classList.toggle('active', button.dataset.filter === category);
    });
    renderFilterOptions(category, true);
}

function applyFilters() {
    const activeSet = selectedFiltersByCategory[currentCategory];
    const field = categoryFieldMap[currentCategory];

    const filtered = artists.filter(artist => {
        if (!activeSet.size) {
            return true;
        }

        const raw = normalizeText(artist.source[field]);
        return activeSet.has(raw);
    });

    renderArtistCards(filtered);
    updateFooter(filtered.length, Array.from(activeSet));
}

function renderArtistCards(data) {
    if (!data.length) {
        artistGrid.innerHTML = '<div class="artist-empty">No artists match the selected filters.</div>';
        return;
    }

    artistGrid.innerHTML = data
        .map(artist => {
            const hasImage = artist.image && artist.image !== 'Unknown';
            const imageHtml = hasImage
                ? `<img class="artist-img" src="${artist.image}" alt="${artist.name}" onerror="this.closest('.card-image-area') && (this.closest('.card-image-area').__imgError = true); handleImageError(this)"/>`
                : `<div class="no-image-placeholder">No Image</div>`;

            return `
                <article class="artist-card" data-name="${artist.name}">
                    <div class="card-image-area">
                        ${imageHtml}
                    </div>
                    <div class="card-content">
                        <div class="hover-underline-container">
                          <div class="underline-svg-wrapper">
                            <svg class="underline-svg" fill="none" preserveAspectRatio="none" viewBox="0 0 333 4.4"><path d="M0 2.2H333" stroke="#A3A5FF" stroke-width="4.4" /></svg>
                          </div>
                        </div>
                        <div style="display:flex;flex-direction:column;gap:11.276px;">
                          <div class="nationality-badge"><p class="nationality-text">${artist.nationality}</p></div>
                          <div class="info-row"><p class="info-text">${artist.date}</p><div class="dot-sep"></div><p class="info-text">${artist.place}</p></div>
                          <p class="artist-name">${artist.name}</p>
                        </div>
                        <button class="view-btn" data-artist="${artist.name}">
                          <p class="btn-text">View Profile</p>
                          <svg class="btn-icon" fill="none" viewBox="0 0 20 20"><path d="M5.625 10H14.375M14.375 10L10.625 6.25M14.375 10L10.625 13.75" stroke="#EDF8B1" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" /></svg>
                        </button>
                    </div>
                </article>
            `;
        })
        .join('');

    // attach interactions after rendering
    setupArtistCardInteractions();
}

function updateFooter(count, filters) {
    if (artistCount) {
        artistCount.textContent = `${count} artist${count === 1 ? '' : 's'}`;
    }

    if (activeFiltersLabel) {
        if (!filters.length) {
            activeFiltersLabel.textContent = 'No filters selected';
        } else {
            activeFiltersLabel.textContent = `Filters: ${filters.join(', ')}`;
        }
    }
}

function clearAllFilters() {
    Object.values(selectedFiltersByCategory).forEach(set => set.clear());
    applyFilters();
    renderCategoryButtons();
}

categoryButtons.forEach(button => {
    button.addEventListener('click', () => {
        const category = button.dataset.filter;
        if (category === currentCategory && !filterControls.classList.contains('hidden')) {
            closeFilterPopover();
            return;
        }
        openFilterPopover(category);
    });
});

const clearAllButton = document.getElementById('clearAllButton');
if (clearAllButton) {
    clearAllButton.addEventListener('click', clearAllFilters);
}

document.addEventListener('click', event => {
    const target = event.target;
    const suggestions = document.getElementById('searchSuggestions');
    const dynamic = document.getElementById('dynamicSidebarContainer');
    const isOutside = !(filterControls && filterControls.contains(target))
        && !(categoryBar && categoryBar.contains(target))
        && !(suggestions && suggestions.contains(target))
        && !(dynamic && dynamic.contains(target));
    if (isOutside) {
        closeFilterPopover();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    loadData();
    const input = document.getElementById('compactSearchInput');
    if (input) {
        input.addEventListener('input', (e) => { searchQuery = e.target.value; updateUI(); updateSearchSuggestions(searchQuery); });
        input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { searchQuery = input.value; updateUI(); document.getElementById('searchSuggestions')?.classList.add('hidden'); } });
        document.addEventListener('click', (ev) => { const wrapper = document.querySelector('.compact-search-wrapper'); if (wrapper && !wrapper.contains(ev.target)) { document.getElementById('searchSuggestions')?.classList.add('hidden'); } });
    }
    // backdrop closes the popover
    document.getElementById('filterBackdrop')?.addEventListener('click', () => { filterControls.classList.add('hidden'); document.getElementById('searchSuggestions')?.classList.add('hidden'); sidebarState.page = 1; document.getElementById('filterBackdrop')?.classList.remove('visible'); });
});
