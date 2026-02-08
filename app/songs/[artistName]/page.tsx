import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import AddToArkButton from '@/components/AddToArkButton'
import { cookies } from 'next/headers'
import FilterToggleButton from '@/components/FilterToggleButton'

type Props = {
  // フォルダ名が [artistName] なので、ここは必ず artistName になります
  params: Promise<{ artistName: string }> 
}

export default async function ArtistPage({ params }: Props) {
  const { artistName } = await params
  const decodedArtistName = decodeURIComponent(artistName)
  
  const supabase = await createClient()
  const cookieStore = await cookies()

  // 1. モード判定（リアルユーザーのみか、全部か）
  const isRealOnly = cookieStore.get('filter_mode')?.value !== 'all'

  // 2. 使うViewを切り替え
  // 全データなら song_stats, リアルのみなら song_stats_real
  const viewName = isRealOnly ? 'song_stats_real' : 'song_stats'
  
  // 3. データ取得
  const { data: songList, error } = await supabase
    .from(viewName)
    .select('*')
    .eq('artist', decodedArtistName)
    .order('total_score', { ascending: false })  // 第1優先：スコア
    .order('vote_count', { ascending: false })   // 第2優先：票数
    .order('last_updated', { ascending: false }) // 第3優先：更新日時
  
  if (error) {
    console.error(error)
    return <div>データ取得エラー</div>
  }

  if (!songList) return <div>データが見つかりません</div>

  return (
    <div style={{ maxWidth: '800px', margin: '50px auto', fontFamily: 'sans-serif', padding: '0 20px' }}>
      
      {/* ナビゲーションエリア */}
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Link href="/" style={{ textDecoration: 'none', color: '#666', fontSize: '0.9em' }}>
            ← 自分の箱舟に戻る
          </Link>
          <Link href="/songs" style={{ textDecoration: 'none', color: '#666', fontSize: '0.9em' }}>
            ← みんなのリストに戻る
          </Link>
        </div>
        <FilterToggleButton isRealOnly={isRealOnly} />
      </div>

      <h1>{decodedArtistName}</h1>
      <p style={{ marginBottom: '30px', color: '#666' }}>
        {isRealOnly ? 'リアルユーザーの投票による曲ランキング' : '登録されている曲の一覧（総合スコア順）'}
      </p>

      <ul style={{ listStyle: 'none', padding: 0 }}>
        {songList.map((item, index) => {
          // 順位計算
          const rank = index + 1
          // 1~3位の色分け
          const rankColor = rank === 1 ? '#d4af37' : (rank === 2 ? '#c0c0c0' : (rank === 3 ? '#cd7f32' : '#ddd'))

          return (
            <li key={item.song} style={{ borderBottom: '1px solid #eee', padding: '15px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              
              {/* 左側：順位・曲名・スコア */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <span style={{ 
                  fontSize: '1.4em', fontWeight: 'bold', color: rankColor, 
                  minWidth: '35px', textAlign: 'center' 
                }}>
                  {rank}
                </span>

                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '1.2em', marginBottom: '4px' }}>
                    {item.song}
                  </div>
                  <div style={{ fontSize: '0.9em', color: '#666', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ color: '#0070f3', fontWeight: 'bold' }}>
                      {item.total_score.toFixed(2)} pt
                    </span>
                    <span style={{ background: '#eee', padding: '1px 6px', borderRadius: '4px', fontSize: '0.85em' }}>
                      {item.vote_count}票
                    </span>
                  </div>
                </div>
              </div>
              
              {/* 右側：ボタンエリア */}
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <a 
                  href={`https://www.youtube.com/results?search_query=${encodeURIComponent(decodedArtistName + ' ' + item.song)}`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ 
                    fontSize: '12px', color: '#d32f2f', textDecoration: 'none', 
                    border: '1px solid #d32f2f', padding: '4px 8px', borderRadius: '4px',
                    display: 'flex', alignItems: 'center'
                  }}
                >
                  ▶ YouTube
                </a>
                <AddToArkButton artist={decodedArtistName} song={item.song} />
              </div>
            </li>
          )
        })}
      </ul>

      {songList.length === 0 && (
        <p>条件に一致する曲がありません。</p>
      )}
    </div>
  )
}