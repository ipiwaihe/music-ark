// scripts/compare_countries.js
const axios = require('axios');

// 比較したいアーティスト
const ARTIST = 'The Beatles'; 
// const ARTIST = 'Queen'; 

async function fetchTopSongs(countryCode) {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(ARTIST)}&country=${countryCode}&entity=song&limit=3`;
    const res = await axios.get(url);
    return res.data.results.map(t => t.trackName);
}

async function compare() {
    console.log(`🔍 ${ARTIST} の人気曲比較\n`);

    try {
        // 日本のトップ3
        const jpSongs = await fetchTopSongs('JP');
        console.log(`🇯🇵 日本 (JP):`);
        jpSongs.forEach((song, i) => console.log(`   ${i+1}. ${song}`));

        console.log(''); // 空行

        // アメリカのトップ3
        const usSongs = await fetchTopSongs('US');
        console.log(`🇺🇸 アメリカ (US):`);
        usSongs.forEach((song, i) => console.log(`   ${i+1}. ${song}`));

    } catch (e) {
        console.error(e.message);
    }
}

compare();