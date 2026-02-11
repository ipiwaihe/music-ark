// scripts/fetch_itunes.js
const axios = require('axios');

// ★ここを好きなアーティスト名に変えて実験できます
const TARGET_ARTIST = 'Official髭男dism'; 
// const TARGET_ARTIST = 'The Beatles'; 

async function getArtistTopTracks(artistName) {
    console.log(`\n🔍 「${artistName}」を日本のiTunes Storeで検索中...`);

    try {
        // iTunes Search APIのエンドポイント (日本市場: country=JP)
        const url = `https://itunes.apple.com/search?term=${encodeURIComponent(artistName)}&country=JP&entity=song&limit=5`;
        
        const response = await axios.get(url);
        
        if (response.data.resultCount === 0) {
            console.log(`❌ アーティスト「${artistName}」が見つかりませんでした。`);
            return;
        }

        console.log(`✅ ${response.data.resultCount}曲 見つかりました！\n`);
        
        // 取得した曲データをループして表示
        response.data.results.forEach((track, index) => {
            console.log(`--- 第${index + 1}位 ---`);
            console.log(`🎵 曲名: ${track.trackName}`);
            console.log(`🎤 歌手: ${track.artistName}`);
            console.log(`💿 アルバム: ${track.collectionName}`);
            console.log(`🔗 試聴: ${track.previewUrl}`);
            console.log(`🖼️ 画像: ${track.artworkUrl100}`);
            console.log(''); // 空行
        });

    } catch (error) {
        console.error('❌ エラーが発生しました:', error.message);
    }
}

// 実行
getArtistTopTracks(TARGET_ARTIST);