/**
 * Process artist data and generate country color mappings based on artist count
 */

const palette = {
    0: '#FFFFD9',      // No artists
    1: '#B9E3A0',      // 1 artist
    2: '#7BCC9A',      // 2-3 artists
    4: '#89D1C1',      // 4-5 artists
    6: '#41b6c4',      // 6-10 artists
    11: '#1d91c0',     // 11-20 artists
    21: '#225ea8',     // 21-23 artists
    24: '#253494'      // 24+ artists
};

/**
 * Get color based on artist count
 */
function getColorByCount(count) {
    if (count === 0) return palette[0];
    if (count === 1) return palette[1];
    if (count >= 2 && count <= 3) return palette[2];
    if (count >= 4 && count <= 5) return palette[4];
    if (count >= 6 && count <= 10) return palette[6];
    if (count >= 11 && count <= 20) return palette[11];
    if (count >= 21 && count <= 23) return palette[21];
    if (count >= 24) return palette[24];
    return palette[0];
}

/**
 * Process artist data and return country -> count mapping
 */
async function processArtistData() {
    try {
        // Load data files
        const dataResponse = await fetch('./data.json');
        const data = await dataResponse.json();
        
        const matcherResponse = await fetch('./countryMatcher.json');
        const matcher = await matcherResponse.json();
        
        // Count artists per country
        const countryCounts = {};
        
        data.forEach(item => {
            if (item.Nationalité) {
                const frenchNationality = item.Nationalité.toLowerCase().trim();
                let country = matcher.frenchToEnglish[frenchNationality];
                
                if (!country) {
                    // Try partial matching by removing suffixes
                    let matched = false;
                    for (const [french, english] of Object.entries(matcher.frenchToEnglish)) {
                        if (frenchNationality.includes(french.substring(0, 5))) {
                            country = english;
                            matched = true;
                            break;
                        }
                    }
                    if (!matched) return;
                }
                
                countryCounts[country] = (countryCounts[country] || 0) + 1;
            }
        });
        
        // Generate color mapping
        const countryColors = {};
        Object.entries(countryCounts).forEach(([country, count]) => {
            countryColors[country] = {
                count: count,
                color: getColorByCount(count)
            };
        });
        
        return {
            countryCounts,
            countryColors,
            palette
        };
    } catch (error) {
        console.error('Error processing artist data:', error);
        return { countryCounts: {}, countryColors: {}, palette };
    }
}

// Export for use in HTML
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { processArtistData, getColorByCount, palette };
}
