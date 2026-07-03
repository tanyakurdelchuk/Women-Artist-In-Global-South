import ThreeGlobe from 'https://esm.sh/three-globe?external=three';
import * as THREE from 'https://esm.sh/three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js?external=three';
import { BackSide, BufferAttribute, Color, Mesh, ShaderMaterial } from 'https://esm.sh/three';

const assetUrl = (path) => new URL(path, import.meta.url);
const siteUrl = (path) => new URL(`../${path}`, import.meta.url);
const sharedArtistsUrl = assetUrl('../assets/Artists.json');
const sharedArtworksUrl = assetUrl('../assets/Artworks.json');
const CARTOGRAPHY_STATE_KEY = 'cartographyStateV1';

const normalOpacityCountries = [
// Latin America
"Brazil", "Argentina", "Mexico", "Chile", "Colombia", "Venezuela","Belize",
"Peru", "Uruguay", "Ecuador", "Haiti", "Dominican Republic",
"Panama", "Bolivia", "Costa Rica", "El Salvador", "The Bahamas",
"Jamaica", "Paraguay", "Guatemala", "Cuba", "Honduras", "Nicaragua", "Suriname", "Guyana", "Puerto Rico", "Trinidad and Tobago",
// Africa
"Algeria", "South Africa", "Morocco", "Nigeria", "Tunisia", "Mali", "Guinea","Western Sahara",
"Ivory Coast", "Democratic Republic of the Congo", "Cameroon",
"Benin", "Senegal", "Togo", "Egypt", "Mauritius", "Burkina Faso",
"Angola", "Ghana", "Mozambique", "Madagascar", "Liberia", "Zimbabwe",
"Ethiopia", "Rwanda", "Botswana", "Gabon", "Malawi", "Namibia",
"Uganda", "Kenya","Somaliland", "Somalia","United Republic of Tanzania", "Niger", "Sudan", "South Sudan", "Zambia", "Libya", "Sierra Leone", "Republic of the Congo", "Chad", "Central African Republic", "Tanzania", "Eritrea", "Djibouti", "Mauritania", "Lesotho", "Swaziland", "Burundi", "Guinea-Bissau", "Gambia",
// Asia
"Iran", "Palestine","Israel",  "India", "Indonesia", "Thailand", "Vietnam", "Laos", "Myanmar", "Syria", "Oman", "United Arab Emirates", "Qatar",
"Jordan", "Philippines", "Armenia", "Iraq", "Pakistan",
"Kuwait", "Saudi Arabia", "Cambodia", "Malaysia", "Bangladesh",
"Nepal", "Afghanistan", "Turkmenistan", "Sri Lanka",
"Yemen", "China", "Mongolia", "Taiwan", "Singapore", "Brunei", "Bhutan", "North Korea",
// Oceania
"Papua New Guinea", "Fiji", "Samoa", "Tonga", "Vanuatu", "Solomon Islands", "East Timor",
// Europe
"Croatia", "Republic of Serbia", "Bosnia and Herzegovina", "Northern Cyprus", "Cyprus"
];

// Gray color for low-opacity countries
const LOW_OPACITY_COLOR = '#3e3e3e';

// Maps English nationality adjectives (from artists.json) to GeoJSON country names
const englishNationalityToCountry = {
    "afghan": "Afghanistan", "algerian": "Algeria", "angolan": "Angola",
    "argentine": "Argentina", "argentinian": "Argentina",
    "armenian": "Armenia", "bangladeshi": "Bangladesh",
    "beninese": "Benin", "bhutanese": "Bhutan", "bolivian": "Bolivia",
    "bosnian": "Bosnia and Herzegovina", "botswanan": "Botswana", "batswana": "Botswana",
    "brazilian": "Brazil", "bruneian": "Brunei",
    "burkinabe": "Burkina Faso", "burkinabè": "Burkina Faso",
    "burundian": "Burundi", "cambodian": "Cambodia",
    "cameroonian": "Cameroon", "central african": "Central African Republic",
    "chadian": "Chad", "chilean": "Chile", "chinese": "China",
    "colombian": "Colombia", "congolese": "Democratic Republic of the Congo",
    "costa rican": "Costa Rica", "croatian": "Croatia", "cuban": "Cuba",
    "cypriot": "Cyprus", "djiboutian": "Djibouti",
    "dominican": "Dominican Republic", "east timorese": "East Timor",
    "timorese": "East Timor", "ecuadorian": "Ecuador", "ecuadorean": "Ecuador",
    "egyptian": "Egypt", "eritrean": "Eritrea", "ethiopian": "Ethiopia",
    "fijian": "Fiji", "gabonese": "Gabon", "gambian": "Gambia",
    "ghanaian": "Ghana", "guinean": "Guinea", "guinea-bissauan": "Guinea-Bissau",
    "guyanese": "Guyana", "haitian": "Haiti", "honduran": "Honduras",
    "indian": "India", "indonesian": "Indonesia", "iranian": "Iran",
    "iraqi": "Iraq", "ivorian": "Ivory Coast",
    "jamaican": "Jamaica", "jordanian": "Jordan", "kazakh": "Kazakhstan",
    "kenyan": "Kenya", "kuwaiti": "Kuwait", "laotian": "Laos", "lao": "Laos",
    "lebanese": "Lebanon", "lesothan": "Lesotho", "sotho": "Lesotho",
    "liberian": "Liberia", "libyan": "Libya",
    "malagasy": "Madagascar", "malawian": "Malawi",
    "malaysian": "Malaysia", "malian": "Mali",
    "mauritanian": "Mauritania", "mauritian": "Mauritius",
    "mexican": "Mexico", "mongolian": "Mongolia",
    "moroccan": "Morocco", "mozambican": "Mozambique",
    "myanmar": "Myanmar", "burmese": "Myanmar",
    "namibian": "Namibia", "nepalese": "Nepal", "nepali": "Nepal",
    "nicaraguan": "Nicaragua", "nigerian": "Nigeria", "nigerien": "Niger",
    "north korean": "North Korea",
    "omani": "Oman", "pakistani": "Pakistan", "panamanian": "Panama",
    "papua new guinean": "Papua New Guinea",
    "paraguayan": "Paraguay", "peruvian": "Peru",
    "philippine": "Philippines", "filipino": "Philippines",
    "puerto rican": "Puerto Rico",
    "qatari": "Qatar", "rwandan": "Rwanda",
    "salvadoran": "El Salvador", "samoan": "Samoa",
    "saudi": "Saudi Arabia", "saudi arabian": "Saudi Arabia",
    "senegalese": "Senegal", "serbian": "Republic of Serbia",
    "sierra leonean": "Sierra Leone", "singaporean": "Singapore",
    "solomon islander": "Solomon Islands",
    "somali": "Somalia", "south african": "South Africa",
    "south sudanese": "South Sudan", "sri lankan": "Sri Lanka",
    "sudanese": "Sudan", "surinamese": "Suriname",
    "swazi": "Swaziland", "syrian": "Syria",
    "taiwanese": "Taiwan",
    "tanzanian": "United Republic of Tanzania",
    "thai": "Thailand", "togolese": "Togo",
    "trinidadian": "Trinidad and Tobago",
    "tunisian": "Tunisia", "turkmen": "Turkmenistan",
    "ugandan": "Uganda", "emirati": "United Arab Emirates",
    "uruguayan": "Uruguay", "uzbek": "Uzbekistan",
    "vanuatuan": "Vanuatu", "ni-vanuatu": "Vanuatu",
    "venezuelan": "Venezuela", "vietnamese": "Vietnam",
    "yemeni": "Yemen", "zambian": "Zambia",
    "zimbabwean": "Zimbabwe",
    "palestinian": "Israel",
    "israeli": "Israel"
};

// Maps common country name variants found in artists.json text fields to GeoJSON ADMIN names
const countryNameAliases = {
    "france": "France", "united kingdom": "United Kingdom", "uk": "United Kingdom",
    "switzerland": "Switzerland", "suisse": "Switzerland", "schweiz": "Switzerland",
    "germany": "Germany", "allemagne": "Germany", "deutschland": "Germany",
    "russia": "Russia", "ussr": "Russia", "soviet union": "Russia",
    "spain": "Spain", "espagne": "Spain",
    "italy": "Italy", "italie": "Italy",
    "netherlands": "Netherlands", "pays-bas": "Netherlands", "holland": "Netherlands",
    "belgium": "Belgium", "belgique": "Belgium",
    "sweden": "Sweden", "suède": "Sweden",
    "norway": "Norway", "norvège": "Norway",
    "denmark": "Denmark", "danemark": "Denmark",
    "austria": "Austria", "autriche": "Austria",
    "portugal": "Portugal",
    "usa": "United States of America", "united states": "United States of America",
    "états-unis": "United States of America", "etats-unis": "United States of America",
    "canada": "Canada",
    "australia": "Australia", "australie": "Australia",
    "new zealand": "New Zealand",
    "japan": "Japan", "japon": "Japan",
    "south korea": "South Korea", "corée": "South Korea", "coree": "South Korea",
    "turkey": "Turkey", "turquie": "Turkey",
    "algerie": "Algeria", "algérie": "Algeria",
    "maroc": "Morocco",
    "tunisie": "Tunisia",
    "argentine": "Argentina",
    "mexique": "Mexico",
    "bresil": "Brazil", "brésil": "Brazil",
    "chine": "China",
    "liban": "Lebanon",
    "irak": "Iraq",
    "syrie": "Syria",
    "egypte": "Egypt", "égypte": "Egypt",
    "afrique du sud": "South Africa",
    "sénégal": "Senegal", "senegal": "Senegal",
    "côte d'ivoire": "Ivory Coast", "cote d'ivoire": "Ivory Coast",
    "tanzanie": "United Republic of Tanzania"
};

function normalizeCountryName(raw) {
    if (!raw) return null;
    // Strip trailing qualifiers like "since 1990" or "et à ..."
    const cleaned = raw.trim().replace(/\s+since\s+\d.*$/i, '').trim();
    const lower = cleaned.toLowerCase();
    return countryNameAliases[lower] || cleaned;
}

function parseCurrentCountry(livesStr) {
    if (!livesStr || !livesStr.trim()) return null;
    // Find the last parenthesized group in the string
    const m = livesStr.match(/\(([^)]+)\)[^(]*$/);
    if (m) {
        // Take the last comma-separated part (handles "Val-de-Marne, France")
        const parts = m[1].split(',');
        return normalizeCountryName(parts[parts.length - 1].trim());
    }
    // Fallback: text immediately after "in "
    const inM = livesStr.match(/\bin\s+([^,(]+)/i);
    if (inM) return normalizeCountryName(inM[1].trim());
    return null;
}

fetch(assetUrl('./ne_110m_admin_0_countries.geojson')).then(res => res.json()).then(countries =>
{
    // Extract features from GeoJSON
    const features = countries.features;
    
    // Define a color palette (at least 4 colors for map coloring)
    const palette = ['#FFFFD9', '#B9E3A0','#7BCC9A', '#A7DDD1', '#41b6c4', '#1d91c0', '#225ea8', '#253494'];
    const paletteLegendBuckets = [
        { color: '#FFFFD9', label: 'No artists' },
        { color: '#B9E3A0', label: '1 to 3 artists' },
        { color: '#89D1C1', label: '4 to 9 artists' },
        { color: '#41b6c4', label: '10 to 24 artists' },
        { color: '#253494', label: '24+ artists' }
    ];

    // Check each feature for normal opacity
    features.forEach((feature, i) => {
        const countryName = feature.properties.ADMIN || feature.properties.name || feature.properties.NAME || feature.properties.NAME_EN || feature.properties.SOVEREIGNT;
        // Check if this country should have normal opacity or be gray
        const hasNormalOpacity = normalOpacityCountries.some(normalCountry => {
            const name = countryName.toLowerCase();
            const normal = normalCountry.toLowerCase();
            // Exact match only
            return name === normal;
        });

        feature.properties._isNormalOpacity = hasNormalOpacity;
        // Initialize color - gray for non-normal countries, light for normal countries
        feature.properties._color = hasNormalOpacity ? '#FFFFD9' : LOW_OPACITY_COLOR;
    });

    const Globe = new ThreeGlobe()
        .hexPolygonsData(features)
        .showAtmosphere(true)// removes the halo effect 
        .atmosphereAltitude(0.3) // increases the size of the halo
        .atmosphereColor('#8C96C6') 
        .hexPolygonResolution(3)
        .hexPolygonMargin(0.3)
        .hexPolygonUseDots(false)
        .hexPolygonColor(d =>{
        // Return gray for low-opacity countries, original color for normal ones
            
            return d.properties._isNormalOpacity ? d.properties._color : LOW_OPACITY_COLOR;} )
        .hexPolygonAltitude(() => 0.01);

    // Store original colors for reset
    const originalColors = new Map();
    features.forEach((f, idx) => {
        originalColors.set(idx, f.properties._color);
    });

    // Resolver using countryMatcher.json
    let matcherConfig = null;
    function mapNationalityToCountry(natRaw) {
        if (!matcherConfig) return null;
        const nat = (natRaw || '').toLowerCase().trim();
        if (!nat) return null;

        const dict = matcherConfig.frenchToEnglish || {};
        let match = dict[nat];

        // Try exact match, then partial suffix removal
        if (!match) {
            const base = (matcherConfig.suffixesToRemove || []).reduce((acc, suffix) => {
                return acc.endsWith(suffix) ? acc.slice(0, acc.length - suffix.length) : acc;
            }, nat);

            for (const key in dict) {
                if (key.startsWith(base)) {
                    match = dict[key];
                    break;
                }
            }
        }

        // Validate match against geospatial bounds
        if (match) {
            const bounds = matcherConfig.geographicBounds && matcherConfig.geographicBounds[match];
            if (bounds) {
                // Find feature with matching country name
                const feature = features.find(f => findCountryNameFromFeatureProps(f.properties) === match);
                if (feature && feature.geometry.coordinates) {
                    // Extract centroid from geometry (simple check)
                    const coords = feature.geometry.coordinates;
                    if (Array.isArray(coords) && coords.length > 0) {
                        // Use bounds as region check; if feature is outside bounds, skip
                        // This prevents matching data from the opposite side of the globe
                    }
                }
            }
            return match;
        }
        return null;
    }

    const featureCountryNames = new Set(
        features
            .map(f => findCountryNameFromFeatureProps(f.properties))
            .filter(Boolean)
    );

    function mapAnyNationalityToCountry(natRaw) {
        const nat = (natRaw || '').toLowerCase().trim();
        if (!nat) return null;

        const mapped =
            mapNationalityToCountry(nat) ||
            englishNationalityToCountry[nat] ||
            countryNameAliases[nat];
        if (mapped) return mapped;

        // If nationality already looks like a country name, keep it when it exists in GeoJSON.
        for (const country of featureCountryNames) {
            if (country.toLowerCase() === nat) return country;
        }
        return null;
    }

    function buildCountryStats(artistsData, artworksData) {
        const map = new Map();

        artistsData.forEach(item => {
            const nat = item['Nationality'] || item['Nationalité'] || '';
            const country = mapAnyNationalityToCountry(nat);
            if (!country) return;
            if (!map.has(country)) map.set(country, { artists: new Set(), pieces: 0 });

            const artistName = (item['Artist'] || item['Auteur(s)'] || '').trim();
            if (artistName) map.get(country).artists.add(artistName);
        });

        artworksData.forEach(item => {
            const nat = item['Nationality'] || item['Nationalité'] || '';
            const country = mapAnyNationalityToCountry(nat);
            if (!country) return;
            if (!map.has(country)) map.set(country, { artists: new Set(), pieces: 0 });
            map.get(country).pieces += 1;
        });

        const result = new Map();
        map.forEach((v, k) => result.set(k, { artists: v.artists.size, pieces: v.pieces }));
        return result;
    }

    function buildCountryStatsFromArtworks(items) {
        const map = new Map();
        items.forEach(item => {
            const nat = item['Nationality'] || item['Nationalité'] || '';
            const country = mapAnyNationalityToCountry(nat);
            if (!country) return;
            if (!map.has(country)) map.set(country, { artists: new Set(), pieces: 0 });

            const authors =
                (item['Author(s)'] || item['All the authors of the links'] || item['Auteur(s)'] || item['Tous les auteur(s) des liées'] || '')
                    .split(',')
                    .map(s => s.trim())
                    .filter(Boolean);
            authors.forEach(a => map.get(country).artists.add(a));
            map.get(country).pieces += 1;
        });

        const result = new Map();
        map.forEach((v, k) => result.set(k, { artists: v.artists.size, pieces: v.pieces }));
        return result;
    }

    // Display name mapping for info panel
    const displayNameMapping = {
        "Israel": "Palestine",
        "Cyprus": "Cyprus"
    };

    function getDisplayName(countryName) {
        return displayNameMapping[countryName] || countryName;
    }

    // Info panel
    const info = document.createElement('div');
    info.className = 'info-card';
    const paletteLegendHtml = paletteLegendBuckets.map(bucket => `
        <div class="info-card-legend-row">
            <span class="info-card-legend-swatch" style="background:${bucket.color}"></span>
            <span class="info-card-legend-text">${bucket.label}</span>
        </div>
    `).join('');
    info.innerHTML = `
        <div class="info-card-header">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span>Country Info</span>
        </div>
        <div class="info-card-body">
            <p class="info-card-hint">Hover a country</p>
        </div>
        <div class="info-card-journey-section">
            <label class="journey-checkbox-label">
                <input type="checkbox" id="countryJourneyCheckbox" disabled />
                <span>All Artist Journeys</span>
            </label>
        </div>
        <div class="info-card-divider"></div>
        <div class="info-card-legend-section">
            <span class="info-card-legend-title">Map Legend</span>
            ${paletteLegendHtml}
        </div>
    `;
    document.body.appendChild(info);

    // ---- Artist panel ----
    const artistPanel = document.createElement('div');
    artistPanel.className = 'artist-panel';
    artistPanel.innerHTML = `
        <div class="artist-panel-header">
            <button class="artist-panel-back">&#x2190; Back</button>
            <span class="artist-panel-title"></span>
            <button class="artist-panel-close">&#x2715;</button>
        </div>
        <div class="artist-panel-grid-view">
            <div class="artist-panel-subtitle"></div>
            <div class="artist-panel-grid"></div>
        </div>
        <div class="artist-panel-profile-view">
            <div class="artist-panel-profile-img-area"></div>
            <div class="artist-panel-profile-body">
                <p class="artist-panel-profile-name"></p>
                <p class="artist-panel-profile-birth"></p>
                <div class="artist-panel-profile-nat-tags artist-panel-profile-tags"></div>
                <div class="artist-panel-profile-loc-tags artist-panel-profile-tags"></div>
                <div class="artist-panel-profile-journey">
                    <label class="journey-checkbox-label">
                        <input type="checkbox" id="journeyCheckbox" />
                        <span>Artistic Journey</span>
                    </label>
                </div>
                <div class="artist-panel-profile-footer">
                    <a class="artist-panel-profile-btn" href="#">
                        View Profile &#x2192;
                    </a>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(artistPanel);

    function clampArtistPanelToViewport() {
        const rect = artistPanel.getBoundingClientRect();
        const minLeft = 12;
        const minTop = 82;
        const maxLeft = Math.max(minLeft, window.innerWidth - rect.width - 12);
        const maxTop = Math.max(minTop, window.innerHeight - rect.height - 12);

        const currentLeft = Number.parseFloat(artistPanel.style.left);
        const currentTop = Number.parseFloat(artistPanel.style.top);
        const fallbackLeft = Number.isFinite(currentLeft) ? currentLeft : rect.left;
        const fallbackTop = Number.isFinite(currentTop) ? currentTop : rect.top;

        artistPanel.style.left = `${Math.min(maxLeft, Math.max(minLeft, fallbackLeft))}px`;
        artistPanel.style.top = `${Math.min(maxTop, Math.max(minTop, fallbackTop))}px`;
    }

    function enableArtistPanelDragging() {
        const header = artistPanel.querySelector('.artist-panel-header');
        if (!header) return;

        let drag = null;

        header.addEventListener('pointerdown', (event) => {
            if (event.button !== 0) return;
            if (event.target.closest('button, a, input, label')) return;

            const rect = artistPanel.getBoundingClientRect();
            artistPanel.style.left = `${rect.left}px`;
            artistPanel.style.top = `${rect.top}px`;

            drag = {
                pointerId: event.pointerId,
                offsetX: event.clientX - rect.left,
                offsetY: event.clientY - rect.top
            };

            header.setPointerCapture(event.pointerId);
            artistPanel.classList.add('is-dragging');
            event.preventDefault();
        });

        header.addEventListener('pointermove', (event) => {
            if (!drag || event.pointerId !== drag.pointerId) return;

            const rect = artistPanel.getBoundingClientRect();
            const minLeft = 12;
            const minTop = 82;
            const maxLeft = Math.max(minLeft, window.innerWidth - rect.width - 12);
            const maxTop = Math.max(minTop, window.innerHeight - rect.height - 12);

            const nextLeft = Math.min(maxLeft, Math.max(minLeft, event.clientX - drag.offsetX));
            const nextTop = Math.min(maxTop, Math.max(minTop, event.clientY - drag.offsetY));

            artistPanel.style.left = `${nextLeft}px`;
            artistPanel.style.top = `${nextTop}px`;
        });

        const finishDrag = (event) => {
            if (!drag || event.pointerId !== drag.pointerId) return;

            try {
                header.releasePointerCapture(event.pointerId);
            } catch {
                // ignore if capture was already released
            }

            drag = null;
            artistPanel.classList.remove('is-dragging');
        };

        header.addEventListener('pointerup', finishDrag);
        header.addEventListener('pointercancel', finishDrag);
    }

    enableArtistPanelDragging();
    window.addEventListener('resize', clampArtistPanelToViewport);

    let currentCountryDisplayName = '';
    let currentArtistName = '';
    let currentInfoCountryName = null;
    let artistArcMap = new Map();
    let pendingRestoreState = null;
    let suppressPanelOpenUntil = 0;

    try {
        const rawState = sessionStorage.getItem(CARTOGRAPHY_STATE_KEY);
        pendingRestoreState = rawState ? JSON.parse(rawState) : null;
    } catch {
        pendingRestoreState = null;
    }

    function saveCartographyState() {
        try {
            const allJourneysCheckbox = document.getElementById('countryJourneyCheckbox');
            const journeyCheckbox = document.getElementById('journeyCheckbox');
            const state = {
                searchQuery,
                activeCountryFocus,
                currentInfoCountryName,
                currentArtistName,
                panelOpen: artistPanel.classList.contains('open'),
                profileOpen: artistPanel.classList.contains('profile-open'),
                allJourneys: !!(allJourneysCheckbox && allJourneysCheckbox.checked),
                artistJourney: !!(journeyCheckbox && journeyCheckbox.checked),
                camera: {
                    position: { x: camera.position.x, y: camera.position.y, z: camera.position.z },
                    target: { x: controls.target.x, y: controls.target.y, z: controls.target.z }
                }
            };
            sessionStorage.setItem(CARTOGRAPHY_STATE_KEY, JSON.stringify(state));
        } catch {
            // Ignore sessionStorage failures.
        }
    }

    function getCountryArcs(countryName) {
        if (!countryName) return [];
        const countryArtists = artistsByCountry[countryName] || [];
        const arcs = [];
        countryArtists.forEach(artist => {
            const artistArcs = artistArcMap.get(artist.name) || [];
            artistArcs.forEach(arc => arcs.push(arc));
        });
        return arcs;
    }

    function refreshJourneyArcs() {
        const allJourneysCheckbox = document.getElementById('countryJourneyCheckbox');
        const individualJourneyCheckbox = document.getElementById('journeyCheckbox');

        if (allJourneysCheckbox && allJourneysCheckbox.checked && currentInfoCountryName) {
            Globe.arcsData(getCountryArcs(currentInfoCountryName));
            return;
        }

        if (individualJourneyCheckbox && individualJourneyCheckbox.checked) {
            Globe.arcsData(artistArcMap.get(currentArtistName) || []);
            return;
        }

        Globe.arcsData([]);
    }

    const countryJourneyCheckbox = document.getElementById('countryJourneyCheckbox');
    if (countryJourneyCheckbox) {
        countryJourneyCheckbox.addEventListener('change', () => {
            if (countryJourneyCheckbox.checked) {
                const journeyCheckbox = document.getElementById('journeyCheckbox');
                if (journeyCheckbox) journeyCheckbox.checked = false;
            }
            refreshJourneyArcs();
            saveCartographyState();
        });
    }

    artistPanel.querySelector('.artist-panel-close').addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        suppressPanelOpenUntil = Date.now() + 300;
        artistPanel.classList.remove('open', 'profile-open');
        saveCartographyState();
    });
    artistPanel.querySelector('.artist-panel-back').addEventListener('click', () => {
        artistPanel.classList.remove('profile-open');
        artistPanel.querySelector('.artist-panel-title').textContent = currentCountryDisplayName;
        currentArtistName = '';
        const previousFocus = (artistPanel.dataset.previousCountryFocus || '').trim();
        const previousQuery = artistPanel.dataset.previousSearchQuery || '';
        activeCountryFocus = previousFocus || null;
        searchQuery = previousQuery;
        const input = document.getElementById('compactSearchInput');
        if (input) input.value = searchQuery;
        updateUI();
        const cb = document.getElementById('journeyCheckbox');
        if (cb) { cb.checked = false; }
        refreshJourneyArcs();
        saveCartographyState();
    });
    artistPanel.querySelector('.artist-panel-profile-btn').addEventListener('click', () => {
        saveCartographyState();
    });

    function parseBirthInfo(birthStr) {
        if (!birthStr || !birthStr.trim()) return { year: '', place: '' };
        const part = birthStr.split(/\s*-\s*\d{4}/)[0].trim();
        const yearM = part.match(/^(\d{4})/);
        const year = yearM ? yearM[1] : '';
        const placeM = part.match(/^\d{4},?\s*(.+)/);
        const place = placeM ? placeM[1].trim() : '';
        return { year, place };
    }

    function parseLocationTags(livesStr) {
        if (!livesStr || !livesStr.trim()) return [];
        const tags = [];
        const segments = livesStr.split(/\s+et\s+[\u00e0a]\s+|\s+and\s+in\s+/i);
        segments.forEach(seg => {
            seg = seg.trim().replace(/\s*\.$/, '').replace(/\s+since\s+\d+.*/i, '').trim();
            if (!seg) return;
            seg = seg.replace(/^lives\s+and\s+works?\s+in\s+/i, 'LIVES IN ')
                     .replace(/^worked?\s+in\s+/i, 'WORKED IN ')
                     .replace(/^works?\s+in\s+/i, 'WORKS IN ');
            if (!seg.match(/^(LIVES|WORKED|WORKS)/i)) seg = 'LIVES IN ' + seg;
            tags.push(seg.toUpperCase());
        });
        return tags;
    }

    function updateArtistJourneyVisibility(artistName) {
        const journeySection = artistPanel.querySelector('.artist-panel-profile-journey');
        const journeyCheckbox = document.getElementById('journeyCheckbox');
        const hasJourney = (artistArcMap.get(artistName) || []).length > 0;

        if (journeySection) {
            journeySection.style.display = hasJourney ? '' : 'none';
        }

        if (journeyCheckbox) {
            journeyCheckbox.checked = false;
            journeyCheckbox.disabled = !hasJourney;
        }
    }

    function showArtistProfile(artist) {
        const { name, img, lives, nationality } = artist;
        artistPanel.dataset.previousCountryFocus = activeCountryFocus || '';
        artistPanel.dataset.previousSearchQuery = searchQuery || '';
        const encodedImg = img ? img.split('/').map(encodeURIComponent).join('/') : '';
        const profileImgArea = artistPanel.querySelector('.artist-panel-profile-img-area');
        profileImgArea.innerHTML = '';
        if (encodedImg) {
            const profileImg = document.createElement('img');
            profileImg.className = 'artist-panel-profile-photo';
            profileImg.src = encodedImg;
            profileImg.alt = name;
            profileImg.addEventListener('error', () => {
                profileImgArea.innerHTML = '<div class="artist-panel-profile-no-photo">No image</div>';
            });
            profileImgArea.appendChild(profileImg);
        } else {
            profileImgArea.innerHTML = '<div class="artist-panel-profile-no-photo">No image</div>';
        }

        artistPanel.querySelector('.artist-panel-title').textContent = name;
        artistPanel.querySelector('.artist-panel-profile-name').textContent = name;

        const { year, place } = parseBirthInfo(artist.birth || '');
        const birthEl = artistPanel.querySelector('.artist-panel-profile-birth');
        birthEl.textContent = [year, place].filter(Boolean).join(' \u00b7 ');
        birthEl.style.display = (year || place) ? '' : 'none';

        const natTags = artistPanel.querySelector('.artist-panel-profile-nat-tags');
        natTags.innerHTML = (nationality || '').split(',').map(n => n.trim()).filter(Boolean)
            .map(n => `<span class="artist-panel-profile-tag">${n.toUpperCase()}</span>`).join('');

        const locTags = artistPanel.querySelector('.artist-panel-profile-loc-tags');
        locTags.innerHTML = parseLocationTags(lives || '')
            .map(l => `<span class="artist-panel-profile-tag location">${l}</span>`).join('');

        const artistProfileUrl = siteUrl('artist-detail.html');
        artistProfileUrl.searchParams.set('name', name);
        const profileBtn = artistPanel.querySelector('.artist-panel-profile-btn');
        profileBtn.href = artistProfileUrl.href;

        // Scroll profile view to top
        artistPanel.querySelector('.artist-panel-profile-view').scrollTop = 0;

        // Update current artist, reset checkbox and arcs
        currentArtistName = name;
        activeCountryFocus = resolveCountryFocus(artist.country || currentInfoCountryName || '');
        updateGlobeColors(lastFilteredArtists.length ? lastFilteredArtists : artists);
        if (activeCountryFocus) {
            updateInfoPanel(activeCountryFocus, countryStats);
        }
        updateArtistJourneyVisibility(name);
        refreshJourneyArcs();

        artistPanel.classList.add('profile-open');
        saveCartographyState();
    }

    function openArtistPanel(countryName) {
        const displayName = getDisplayName(countryName);
        const countryArtists = artistsByCountry[countryName] || [];

        // Always reset to grid view when opening a country
        artistPanel.classList.remove('profile-open');
        currentCountryDisplayName = displayName;

        const total = rawArtistsData.length;
        artistPanel.querySelector('.artist-panel-title').textContent = displayName;
        artistPanel.querySelector('.artist-panel-subtitle').textContent =
            `${countryArtists.length} artist${countryArtists.length !== 1 ? 's' : ''} out of ${total}`;

        const grid = artistPanel.querySelector('.artist-panel-grid');
        if (!countryArtists.length) {
            grid.innerHTML = '<p style="color:rgba(255,255,255,0.4);font-size:12px;padding:8px;">No data for this country.</p>';
        } else {
            grid.innerHTML = countryArtists.map((artist, i) => {
                const { name, img, lives } = artist;
                const livesHtml = lives ? `<span class="artist-panel-lives">${lives}</span>` : '';
                const encodedImg = img ? img.split('/').map(encodeURIComponent).join('/') : '';
                return `
                    <div class="artist-panel-card" data-artist-index="${i}" style="cursor:pointer">
                        <div class="artist-panel-img-wrap">
                            ${ encodedImg
                                ? `<img class="artist-panel-img" src="${encodedImg}" alt="${name}" loading="lazy" />`
                                : `<div class="artist-panel-no-img">No photo</div>`
                            }
                        </div>
                        <span class="artist-panel-name">${name}</span>
                        ${livesHtml}
                    </div>`;
            }).join('');

            // Wire up clicks on each card
            grid.querySelectorAll('.artist-panel-card').forEach(card => {
                card.addEventListener('click', () => {
                    const idx = parseInt(card.getAttribute('data-artist-index'), 10);
                    showArtistProfile(countryArtists[idx]);
                });
            });

            // Replace broken image URLs with a clean placeholder.
            grid.querySelectorAll('.artist-panel-img').forEach(imgEl => {
                imgEl.addEventListener('error', () => {
                    const wrap = imgEl.closest('.artist-panel-img-wrap');
                    if (!wrap) return;
                    wrap.innerHTML = '<div class="artist-panel-no-img">No image</div>';
                });
            });
        }
        artistPanel.classList.add('open');
        clampArtistPanelToViewport();
        saveCartographyState();
    }

    function updateInfoPanel(countryName, stats) {
        const body = info.querySelector('.info-card-body');
        const allJourneysCheckbox = document.getElementById('countryJourneyCheckbox');
        currentInfoCountryName = countryName || null;

        if (allJourneysCheckbox) {
            allJourneysCheckbox.disabled = !countryName;
        }

        if (!countryName) {
            body.innerHTML = '<p class="info-card-hint">Hover a country</p>';
            refreshJourneyArcs();
            return;
        }
        const displayName = getDisplayName(countryName);
        if (stats && stats[countryName]) {
            const { artists, pieces } = stats[countryName];
            body.innerHTML = `
                <p class="info-card-country">${displayName}</p>
                <div class="info-card-stat"><span class="info-card-label">Artists</span><span class="info-card-value">${artists}</span></div>
                <div class="info-card-stat"><span class="info-card-label">Artworks</span><span class="info-card-value">${pieces}</span></div>
            `;
        } else {
            body.innerHTML = `
                <p class="info-card-country">${displayName}</p>
                <p class="info-card-hint">No data</p>
            `;
        }

        refreshJourneyArcs();
    }

    // Helper function to get color by artist count
    function getColorByCount(count) {
        if (count === 0) return palette[0];      // #FFFFD9
        if (count === 1) return palette[1];      // #c7e9b4
        if (count >= 2 && count <= 5) return palette[2];  // #7fcdbb
        if (count >= 6 && count <= 10) return palette[3]; // #41b6c4
        if (count >= 11 && count <= 20) return palette[4];// #1d91c0
        if (count >= 21 && count <= 23) return palette[5];// #225ea8
        if (count >= 24) return palette[6];      // #253494
        return palette[0];
    }

    // Load matcher config and dataset, then prepare stats
    let countryStats = {};
    let rawItems = [];
    let rawArtistsData = [];
    let artistsByCountry = {};
    Promise.all([
        fetch(assetUrl('./countryMatcher.json')).then(r => r.json()).then(cfg => { matcherConfig = cfg; }),
        fetch(sharedArtistsUrl).then(r => r.json()).catch(() => []),
        fetch(sharedArtworksUrl).then(r => r.json()).catch(() => []),
        fetch(assetUrl('./countries_coo.json')).then(r => r.json()).catch(() => ({ countries: [] }))
    ]).then(([_, artistsData, items, citiesData]) => {
        rawItems = items;
        rawArtistsData = artistsData;

        // Build artistsByCountry lookup from artists.json
        artistsData.forEach(entry => {
            const nat = (entry['Nationality'] || '').toLowerCase().trim();
            const country = englishNationalityToCountry[nat];
            if (!country) return;
            if (!artistsByCountry[country]) artistsByCountry[country] = [];
            artistsByCountry[country].push({
                country,
                name: (entry['Artist'] || '').trim(),
                img: (entry['Image'] || '').trim(),
                lives: (entry['Lives / Works'] || '').trim(),
                birth: (entry['Birth / death'] || '').trim(),
                nationality: (entry['Nationality'] || '').trim(),
                bio: (entry['Biography'] || '').trim(),
                video: (entry['Video'] || '').trim()
            });
        });
        const statsMap = buildCountryStats(artistsData, items);
        // flatten Map to plain object for quick lookup
        statsMap.forEach((v, k) => { countryStats[k] = v; });
        // Fallback: if the shared artists dataset had no entries, build stats directly from artists data
        if (Object.keys(countryStats).length === 0) {
            Object.entries(artistsByCountry).forEach(([country, list]) => {
                countryStats[country] = { artists: list.length, pieces: list.length };
            });
        }
        
        // Assign colors to features based on artist counts
        features.forEach(feature => {
            const countryName = findCountryNameFromFeatureProps(feature.properties);
            // Only assign color if country has normal opacity
            if (feature.properties._isNormalOpacity) {
                if (countryName && countryStats[countryName]) {
                    const artistCount = countryStats[countryName].artists;
                    feature.properties._color = getColorByCount(artistCount);
                } else {
                    feature.properties._color = palette[0]; // default color for no data
                }
            } else {
                // Gray countries keep their gray color
                feature.properties._color = LOW_OPACITY_COLOR;
            }
            originalColors.set(features.indexOf(feature), feature.properties._color);
        });
        
        // Update globe with colored features
        Globe.hexPolygonsData(features);

        // Populate artists array for filter UI
        const seen = new Set();
        artists = items.map(item => ({
            name: normalizeText(item['Author(s)'] || item['All the authors of the links'] || item['Auteur(s)'] || item['Tous les auteur(s) des liées']),
            nationality: normalizeText(item['Nationality'] || item['Nationalité']),
            place: normalizeText(item['Lives / Works'] || item['Place of production'] || item['Vit / travaille'] || item['Lieu de réalisation'] || item['Birth / death'] || item['Naissance / décès']),
            date: normalizeText(item['Date of creation'] || item['Date'] || item['Date de création'] || item['Naissance / décès']),
            medium: normalizeText(item['Domain, name'] || item['Domaine, dénomination'] || item['Domaine']),
            source: item
        })).filter(a => {
            const key = (a.name || '').toLowerCase().trim();
            if (!key || key === 'unknown') return false;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
        // Fallback to artists data when primary item list is unavailable
        if (artists.length === 0 && artistsData.length > 0) {
            artists = artistsData.map(entry => ({
                name: normalizeText(entry['Artist']),
                nationality: normalizeText(entry['Nationality']),
                place: normalizeText(entry['Lives / Works']),
                date: normalizeText(entry['Birth / death']),
                medium: '',
                source: entry
            })).filter(a => {
                const key = (a.name || '').toLowerCase().trim();
                if (seen.has(key)) return false;
                seen.add(key);
                return !!key;
            });
        }
        lastFilteredArtists = artists;
        initFilterEventListeners();

        // Build country centroids from GeoJSON for arc drawing
        const countryToCentroid = {};
        features.forEach(f => {
            const cname = findCountryNameFromFeatureProps(f.properties);
            if (!cname || !f.geometry) return;
            const pts = [];
            (function collect(a) {
                if (typeof a[0] === 'number') pts.push(a);
                else a.forEach(collect);
            })(f.geometry.coordinates);
            if (!pts.length) return;
            let sumLng = 0, sumLat = 0;
            pts.forEach(p => { sumLng += p[0]; sumLat += p[1]; });
            countryToCentroid[cname] = { lat: sumLat / pts.length, lng: sumLng / pts.length };
        });

        // Build city coordinates lookup from countries_coo.json (by capital name)
        const cityCoords = {};
        (citiesData.countries || []).forEach(city => {
            cityCoords[city.capital.toLowerCase()] = { lat: city.lat, lng: city.lng };
        });

        // Build country-level coordinates from countries_coo.json (by country name)
        const countryToCoords = {};
        (citiesData.countries || []).forEach(c => {
            countryToCoords[c.country.toLowerCase()] = { lat: c.lat, lng: c.lng };
        });
        // Bridge mismatches between parseCurrentCountry output and countries_coo.json names
        const livesCountryAliases = {
            'united states of america': 'united states west',
            'united republic of tanzania': 'tanzania',
            'republic of serbia': 'serbia',
            'democratic republic of the congo': 'congo (dr)',
            'republic of the congo': 'congo (republic)',
            'ivory coast': 'ghana',
            'northern cyprus': 'cyprus',
            'somaliland': 'somalia',
            'east timor': 'timor-leste',
            'swaziland': 'eswatini',
        };

        // French (and variant) city name aliases to lowercase English names in major_cities.json
        const frenchCityAliases = {
            'londres': 'london', 'bruxelles': 'brussels', 'moscou': 'moscow',
            'vienne': 'vienna', 'varsovie': 'warsaw', 'lisbonne': 'lisbon',
            'athènes': 'athens', 'athenes': 'athens', 'copenhague': 'copenhagen',
            'pékin': 'beijing', 'pekin': 'beijing', 'tokio': 'tokyo',
            'djakarta': 'jakarta', 'calcutta': 'kolkata', 'bombay': 'mumbai',
            'rangoun': 'yangon', 'hanoï': 'hanoi', 'hanoi': 'hanoi',
            'téhéran': 'tehran', 'tehran': 'tehran', 'bakou': 'baku',
            'erevan': 'yerevan', 'beyrouth': 'beirut', 'damas': 'damascus',
            'bagdad': 'baghdad', 'singapour': 'singapore', 'dacca': 'dhaka',
            'addis-abeba': 'addis ababa', 'addis abeba': 'addis ababa',
            'alger': 'algiers', 'le cap': 'cape town', 'mexico': 'mexico city',
            'sao paulo': 'são paulo', 'montréal': 'montreal', 'dubaï': 'dubai',
            'séoul': 'seoul', 'manille': 'manila', 'manilla': 'manila',
            'new york': 'new york', 'los angeles': 'los angeles'
        };

        function parseCityFromLives(livesStr) {
            if (!livesStr || !livesStr.trim()) return null;
            // Match the first "in CITY (" or "in CITY" segment
            const m = livesStr.match(/\bin\s+([^,(]+?)(?:\s*\(|\s*$)/i);
            if (!m) return null;
            return m[1].trim().replace(/\s+since\s+\d.*/i, '').trim() || null;
        }

        // Build arc data per artist: name → [{startLat,startLng,endLat,endLng}]
        artistArcMap = new Map();
        artistsData.forEach(entry => {
            const nat = (entry['Nationality'] || '').toLowerCase().trim();
            const birthCountry = englishNationalityToCountry[nat];
            const livesStr = entry['Lives / Works'] || '';
            const currentCountry = parseCurrentCountry(livesStr);
            if (!birthCountry || !currentCountry || birthCountry === currentCountry) return;
            const start = countryToCentroid[birthCountry];
            if (!start) return;
            // Use city coords if available, then country coords from countries_coo.json, then GeoJSON centroid
            let end = null;
            const rawCity = parseCityFromLives(livesStr);
            if (rawCity) {
                const key = rawCity.toLowerCase();
                end = cityCoords[frenchCityAliases[key] || key];
            }
            if (!end && currentCountry) {
                const ckey = currentCountry.toLowerCase();
                end = countryToCoords[livesCountryAliases[ckey] || ckey];
            }
            if (!end) end = countryToCentroid[currentCountry];
            if (!end) return;
            const artistName = (entry['Artist'] || '').trim();
            if (!artistArcMap.has(artistName)) artistArcMap.set(artistName, []);
            artistArcMap.get(artistName).push({ startLat: start.lat, startLng: start.lng, endLat: end.lat, endLng: end.lng });
        });

        // Configure arcs layer (empty until checkbox is checked)
        Globe
            .arcsData([])
            .arcStartLat(d => d.startLat)
            .arcStartLng(d => d.startLng)
            .arcEndLat(d => d.endLat)
            .arcEndLng(d => d.endLng)
            .arcColor(() => ['rgba(141,211,199,0)', '#9181f9', 'rgba(141,211,199,0)'])
            .arcAltitude(0.25)
            .arcStroke(0.5)
            .arcDashLength(0.35)
            .arcDashGap(0.15)
            .arcDashAnimateTime(2500);

        // Journey checkbox toggle — reacts to whichever artist is currently shown
        const journeyCheckbox = document.getElementById('journeyCheckbox');
        if (journeyCheckbox) {
            journeyCheckbox.addEventListener('change', () => {
                if (journeyCheckbox.checked) {
                    const allJourneysCheckbox = document.getElementById('countryJourneyCheckbox');
                    if (allJourneysCheckbox) allJourneysCheckbox.checked = false;
                }
                refreshJourneyArcs();
                saveCartographyState();
            });
        }

        if (pendingRestoreState && typeof pendingRestoreState === 'object') {
            if (typeof pendingRestoreState.searchQuery === 'string') {
                searchQuery = pendingRestoreState.searchQuery;
                activeCountryFocus = resolveCountryFocus(pendingRestoreState.activeCountryFocus || searchQuery);
                const input = document.getElementById('compactSearchInput');
                if (input) input.value = searchQuery;
                updateUI();
            }

            if (pendingRestoreState.camera && pendingRestoreState.camera.position && pendingRestoreState.camera.target) {
                const p = pendingRestoreState.camera.position;
                const t = pendingRestoreState.camera.target;
                if ([p.x, p.y, p.z, t.x, t.y, t.z].every(v => typeof v === 'number')) {
                    camera.position.set(p.x, p.y, p.z);
                    controls.target.set(t.x, t.y, t.z);
                    controls.update();
                }
            }

            if (pendingRestoreState.panelOpen && pendingRestoreState.currentInfoCountryName) {
                openArtistPanel(pendingRestoreState.currentInfoCountryName);
                if (pendingRestoreState.profileOpen && pendingRestoreState.currentArtistName) {
                    const list = artistsByCountry[pendingRestoreState.currentInfoCountryName] || [];
                    const matched = list.find(a => a.name === pendingRestoreState.currentArtistName);
                    if (matched) showArtistProfile(matched);
                }
            }

            const restoreAllJourneys = document.getElementById('countryJourneyCheckbox');
            if (restoreAllJourneys) restoreAllJourneys.checked = !!pendingRestoreState.allJourneys;
            const restoreJourney = document.getElementById('journeyCheckbox');
            if (restoreJourney) restoreJourney.checked = !!pendingRestoreState.artistJourney;
            if (restoreAllJourneys && restoreJourney && restoreAllJourneys.checked && restoreJourney.checked) {
                restoreAllJourneys.checked = false;
            }
            refreshJourneyArcs();

            pendingRestoreState = null;
            saveCartographyState();
        }
    }).catch(() => { /* silently ignore if not available */ });

    // ---- Search UI ----
    let artists = [];
    let lastFilteredArtists = [];
    let searchQuery = ''
    let activeCountryFocus = null;

    function resolveCountryFocus(raw) {
        const query = (raw || '').trim().toLowerCase();
        if (!query) return null;
        const match = Object.keys(countryStats).find(c => c.toLowerCase() === query);
        return match || null;
    }

    function normalizeText(value) {
        if (!value || !value.toString().trim()) return 'Unknown';
        return value.toString().trim();
    }

    function updateGlobeColors(filteredArtists) {
        const statsMap = buildCountryStatsFromArtworks(filteredArtists.map(a => a.source));
        const filteredStats = {};
        statsMap.forEach((v, k) => { filteredStats[k] = v; });
        features.forEach((feature, idx) => {
            const countryName = findCountryNameFromFeatureProps(feature.properties);
            if (feature.properties._isNormalOpacity) {
                if (activeCountryFocus) {
                    if (countryName === activeCountryFocus) {
                        const focusedArtists =
                            (filteredStats[countryName] && filteredStats[countryName].artists) ||
                            (countryStats[countryName] && countryStats[countryName].artists) ||
                            0;
                        feature.properties._color = getColorByCount(focusedArtists);
                    } else {
                        feature.properties._color = LOW_OPACITY_COLOR;
                    }
                } else if (countryName && filteredStats[countryName]) {
                    feature.properties._color = getColorByCount(filteredStats[countryName].artists);
                } else {
                    feature.properties._color = palette[0];
                }
            } else {
                feature.properties._color = LOW_OPACITY_COLOR;
            }
            originalColors.set(idx, feature.properties._color);
        });
        Globe.hexPolygonsData(features);
    }

    function getSuggestionEntries() {
        const entries = [];
        const seenArtists = new Set();

        artists.forEach(a => {
            const artistName = (a.name || '').trim();
            const location = (a.place || '').trim();

            if (artistName && artistName !== 'Unknown') {
                const key = artistName.toLowerCase();
                if (!seenArtists.has(key)) {
                    entries.push({ type: 'artist', label: artistName, location: location !== 'Unknown' ? location : '' });
                    seenArtists.add(key);
                }
            }

        });

        Object.keys(countryStats).sort((a, b) => a.localeCompare(b)).forEach(country => {
            entries.push({ type: 'country', label: country });
        });

        return entries;
    }

    function openArtistFromName(artistName) {
        const target = (artistName || '').trim().toLowerCase();
        if (!target) return false;

        for (const [country, list] of Object.entries(artistsByCountry)) {
            const matched = list.find(a => (a.name || '').trim().toLowerCase() === target);
            if (matched) {
                openArtistPanel(country);
                showArtistProfile(matched);
                return true;
            }
        }
        return false;
    }

    function updateSearchSuggestions(query) {
        const container = document.getElementById('searchSuggestions');
        if (!container) return;
        if (!query || !query.trim()) { container.classList.add('hidden'); container.innerHTML = ''; return; }
        const q = query.toLowerCase();
        const matches = getSuggestionEntries().filter(e => e.label.toLowerCase().startsWith(q)).slice(0, 12);
        if (!matches.length) { container.classList.add('hidden'); container.innerHTML = ''; return; }
        container.innerHTML = matches.map(m => {
            const safeLabel = m.label.replace(/"/g, '&quot;');
            const safeLocation = (m.location || '').replace(/"/g, '&quot;');
            if (m.type === 'artist') {
                const locationHtml = safeLocation ? `<span class="suggestion-meta">${safeLocation}</span>` : '';
                return `<div class="suggestion-item" data-type="artist" data-val="${safeLabel}"><span class="suggestion-main">${m.label}</span>${locationHtml}</div>`;
            }
            return `<div class="suggestion-item" data-type="country" data-val="${safeLabel}"><span class="suggestion-main">${m.label}</span></div>`;
        }).join('');
        container.classList.remove('hidden');
        container.querySelectorAll('.suggestion-item').forEach(item => {
            item.addEventListener('click', () => {
                const val = item.getAttribute('data-val');
                const type = item.getAttribute('data-type');
                const input = document.getElementById('compactSearchInput');
                if (input) input.value = val;
                searchQuery = val;
                activeCountryFocus = type === 'country' ? resolveCountryFocus(val) : null;
                updateUI();
                if (type === 'artist') {
                    openArtistFromName(val);
                }
                container.classList.add('hidden');
                saveCartographyState();
            });
        });
    }

    function updateUI() {
        let filtered = artists.slice();
        if (searchQuery && searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            filtered = filtered.filter(artist =>
                artist.name.toLowerCase().includes(q) ||
                artist.nationality.toLowerCase().includes(q)
            );
        }
        lastFilteredArtists = filtered;
        updateGlobeColors(filtered);
    }

    function initFilterEventListeners() {
        const input = document.getElementById('compactSearchInput');
        if (input) {
            input.addEventListener('input', (e) => {
                searchQuery = e.target.value;
                activeCountryFocus = null;
                updateUI();
                updateSearchSuggestions(searchQuery);
                saveCartographyState();
            });
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    searchQuery = input.value;
                    activeCountryFocus = resolveCountryFocus(input.value);
                    updateUI();
                    if (!activeCountryFocus) {
                        openArtistFromName(input.value);
                    }
                    document.getElementById('searchSuggestions')?.classList.add('hidden');
                    saveCartographyState();
                }
            });
        }
        document.addEventListener('click', (ev) => {
            const wrapper = document.querySelector('.compact-search-wrapper');
            if (wrapper && !wrapper.contains(ev.target)) {
                document.getElementById('searchSuggestions')?.classList.add('hidden');
            }
        });
    }

    // Raycaster for mouse picking
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let hoveredHexIndex = null;

    function findFeatureIndexFromIntersects(intersects) {
        for (const intersect of intersects) {
            let obj = intersect.object;
            while (obj) {
                if (obj.__data) {
                    const idx = features.indexOf(obj.__data);
                    if (idx !== -1) return idx;
                }
                obj = obj.parent;
            }
        }
        return null;
    }

    function findCountryNameFromFeatureProps(props) {
        // try common name fields from natural earth dataset with proper priority
        return props && (props.ADMIN || props.SOVEREIGNT || props.name || props.NAME || props.BRK_NAME);
    }

    function onMouseMove(event) {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -((event.clientY - CANVAS_TOP) / (window.innerHeight - CANVAS_TOP)) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        
        const intersects = raycaster.intersectObject(Globe, true);
        
        if (intersects.length > 0) {
            const hexIndex = findFeatureIndexFromIntersects(intersects);
            
            if (hexIndex !== null && hexIndex !== -1 && hexIndex !== hoveredHexIndex) {
                // Get country name from feature
                const countryName = findCountryNameFromFeatureProps(features[hexIndex].properties);
                
                // Allow hover on any country with normal opacity
                if (countryName && features[hexIndex].properties._isNormalOpacity) {
                    // Reset previous hover
                    if (hoveredHexIndex !== null && hoveredHexIndex !== -1) {
                        features[hoveredHexIndex].properties._color = originalColors.get(hoveredHexIndex);
                    }
                    // Apply new hover
                    hoveredHexIndex = hexIndex;
                    features[hexIndex].properties._color = '#88419D';
                    Globe.hexPolygonsData(features);
                    updateInfoPanel(countryName, countryStats);
                }
            }
        } else if (hoveredHexIndex !== null) {
            // Reset when not hovering
            features[hoveredHexIndex].properties._color = originalColors.get(hoveredHexIndex);
            hoveredHexIndex = null;
            Globe.hexPolygonsData(features);
        }
    }

    // Setup renderer
    const CANVAS_TOP = 75; // matches margin-top on #globeViz canvas in CSS
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight - CANVAS_TOP);
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
    document.getElementById('globeViz').appendChild(renderer.domElement);

    renderer.domElement.addEventListener('mousemove', onMouseMove);

    // Click to open artist panel
    function onMouseClick(event) {
        // Avoid immediate click-through reopen right after closing the panel.
        if (Date.now() < suppressPanelOpenUntil) return;

        // If the artist panel is open and the click is within its bounds, ignore
        if (artistPanel.classList.contains('open')) {
            const rect = artistPanel.getBoundingClientRect();
            if (event.clientX >= rect.left && event.clientX <= rect.right &&
                event.clientY >= rect.top  && event.clientY <= rect.bottom) {
                return;
            }
        }
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -((event.clientY - CANVAS_TOP) / (window.innerHeight - CANVAS_TOP)) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObject(Globe, true);
        let hexIndex = intersects.length > 0 ? findFeatureIndexFromIntersects(intersects) : null;

        // Fallback to currently hovered country if click raycast misses.
        if ((hexIndex === null || hexIndex === -1) && hoveredHexIndex !== null && hoveredHexIndex !== -1) {
            hexIndex = hoveredHexIndex;
        }

        if (hexIndex !== null && hexIndex !== -1 && features[hexIndex].properties._isNormalOpacity) {
            const countryName = findCountryNameFromFeatureProps(features[hexIndex].properties);
            if (countryName) openArtistPanel(countryName);
        }
    }
    renderer.domElement.addEventListener('click', onMouseClick);

    // Setup scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x2D2D44);

    // Add starfield
    const starsGeometry = new THREE.BufferGeometry();
    const starCount = 5000;
    const positions = new Float32Array(starCount * 3);
    
    for (let i = 0; i < starCount * 3; i += 3) {
        // Generate random positions in a large sphere around the globe
        const radius = 500 + Math.random() * 500;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        
        positions[i] = radius * Math.sin(phi) * Math.cos(theta);
        positions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
        positions[i + 2] = radius * Math.cos(phi);
    }
    
    starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const starsMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 1.5,
        sizeAttenuation: true
    });
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);

    scene.add(Globe);
    scene.add(new THREE.AmbientLight(0xcccccc, Math.PI));
    scene.add(new THREE.DirectionalLight(0x49496E, 0.6 * Math.PI));

    // Add a globe base layer with background color
    const globeGeometry = new THREE.SphereGeometry(101, 40, 40);
    const globeMaterial = new THREE.MeshPhongMaterial({ color: 0x202031 });
    const globeBase = new THREE.Mesh(globeGeometry, globeMaterial);
    scene.add(globeBase);

    // Setup camera
    const camera = new THREE.PerspectiveCamera();
    camera.aspect = window.innerWidth / (window.innerHeight - CANVAS_TOP);
    camera.updateProjectionMatrix();
    camera.position.z = 300;

    // Add camera controls (OrbitControls with constrained vertical tilt)
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.minDistance = 200;
    controls.maxDistance = 800;
    controls.enablePan = false;                // keep interaction focused on rotation/zoom
    controls.rotateSpeed = 1.5;
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    // Constrain vertical angle so left/right rotation is primary but top/bottom can still be seen
    const tiltLimit = Math.PI / 6; // allow ±30° from equator
    controls.minPolarAngle = Math.PI / 2 - tiltLimit;
    controls.maxPolarAngle = Math.PI / 2 + tiltLimit;
    // Ensure camera initially looks at globe center
    camera.position.set(0, 0, 300);
    controls.target.set(0, 0, 0);
    controls.update();
    controls.addEventListener('change', saveCartographyState);
    window.addEventListener('beforeunload', saveCartographyState);

    // Kick-off renderer
    (function animate() { // IIFE
        // Frame cycle
        controls.update();
        renderer.render(scene, camera);
        requestAnimationFrame(animate);
    })();
});