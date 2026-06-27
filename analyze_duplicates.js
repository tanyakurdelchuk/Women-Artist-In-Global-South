const fs = require('fs');

const artists = JSON.parse(fs.readFileSync('assets/artists.json', 'utf8'));
const artworks = JSON.parse(fs.readFileSync('assets/Artworks.json', 'utf8'));

// Count unique artists from artists.json (using same logic as library.js)
function normalizeText(value) {
    if (!value || !value.toString().trim()) {
        return 'Unknown';
    }
    return value.toString().trim();
}

const artistMap = new Map();

// First pass: load artists.json
artists.forEach(item => {
    const name = normalizeText(item['Artist']);
    if (!name || name === 'Unknown') return;
    const key = name.toLowerCase();
    if (!artistMap.has(key)) {
        artistMap.set(key, {
            name,
            id: '',
            source: 'artists.json'
        });
    }
});

console.log('After loading artists.json:', artistMap.size);

// Second pass: process Artworks.json
const beforeSize = artistMap.size;
artworks.forEach(record => {
    const name = normalizeText(record['Author(s)'] || record['All the authors of the links'] || record['Auteur(s)'] || record['Tous les auteur(s) des liées']);
    if (!name || name === 'Unknown') return;
    const key = name.toLowerCase();
    if (!artistMap.has(key)) {
        artistMap.set(key, {
            name,
            id: record['ID'] || record['Id'] || record['id'] || '',
            source: 'Artworks.json'
        });
    }
});

console.log('After loading Artworks.json:', artistMap.size);
console.log('New artists added from Artworks.json:', artistMap.size - beforeSize);

// Find all artists from Artworks.json that weren't in artists.json
const newArtists = Array.from(artistMap.values()).filter(a => a.source === 'Artworks.json');
console.log('\nNew artists only from Artworks.json:');
newArtists.forEach(a => console.log('  - ' + a.name));
