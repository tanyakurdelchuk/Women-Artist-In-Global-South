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

  // Get artist name from URL query parameter
  function getArtistName() {
    const params = new URLSearchParams(window.location.search);
    return params.get('name');
  }

  // Load and display artist data
  function loadArtistData() {
    const artistName = getArtistName();

    if (!artistName) {
      artistNameEl.textContent = 'Artist not found';
      return;
    }

    fetch('./assets/data.json')
      .then(res => res.json())
      .then(data => {
        // Find the artist by name (case-insensitive)
        const artistData = data.find(item => {
          const names = (item['Auteur(s)'] || item['Tous les auteur(s) des liées'] || '').split(',');
          return names.some(name => name.trim().toLowerCase() === artistName.toLowerCase());
        });

        if (!artistData) {
          artistNameEl.textContent = 'Artist not found';
          return;
        }

        // Populate the page with artist data
        const name = (artistData['Auteur(s)'] || artistData['Tous les auteur(s) des liées'] || 'Unknown').split(',')[0].trim();
        const date = (artistData['Date de création'] || artistData['Naissance / décès'] || 'Unknown').trim();
        const place = (artistData['Vit / travaille'] || artistData['Lieu de réalisation'] || artistData['Naissance / décès'] || 'Unknown').trim();
        const medium = (artistData['Domaine, dénomination'] || artistData['Domaine'] || 'Unknown').trim();
        const genre = (artistData['Mots-clés mouvement'] || '').trim();
        const nationality = (artistData['Nationalité'] || 'Unknown').trim();
        const image = (artistData['image'] || '').trim();
        const description = (artistData['Description'] || 'No biography available.').trim();

        // Update title
        document.title = `${name} — Women Artists from the Global South`;

        // Update text content
        artistNameEl.textContent = name;
        artistDateEl.textContent = date;
        artistPlaceEl.textContent = place;
        artistBioEl.textContent = description;

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

        // Add medium tag
        if (medium && medium !== 'Unknown') {
          const mediums = medium.split(',').map(m => m.trim());
          mediums.forEach(m => {
            if (m && m !== 'Unknown') {
              const tag = document.createElement('div');
              tag.className = 'tag tag--yellow';
              tag.innerHTML = `<span>${m.toUpperCase()}</span>`;
              tagsContainer.appendChild(tag);
            }
          });
        }

        // Add genre tag
        if (genre && genre !== 'Unknown') {
          const genres = genre.split(',').map(g => g.trim());
          genres.forEach(g => {
            if (g && g !== 'Unknown') {
              const tag = document.createElement('div');
              tag.className = 'tag tag--yellow';
              tag.innerHTML = `<span>${g.toUpperCase()}</span>`;
              tagsContainer.appendChild(tag);
            }
          });
        }
      })
      .catch(error => {
        console.error('Error loading artist data:', error);
        artistNameEl.textContent = 'Error loading artist data';
      });
  }

  // Initialize
  loadArtistData();

  // Handle "Read full biography" button
  const readMoreBtn = document.getElementById('readMoreBtn');
  if (readMoreBtn) {
    readMoreBtn.addEventListener('click', () => {
      const text = artistBioEl.textContent;
      alert('Full Biography:\n\n' + text);
    });
  }
})();
