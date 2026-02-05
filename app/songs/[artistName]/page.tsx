import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import AddToArkButton from '@/components/AddToArkButton'
import { cookies } from 'next/headers' // ★追加
import FilterToggleButton from '@/components/FilterToggleButton' // ★追加

type Props = {
  params: Promise<{ artistName: string }>
}

export default async function ArtistPage({ params }: Props) {
  const { artistName } = await params
  const decodedArtistName = decodeURIComponent(artistName)
  const supabase = await createClient()

  // ★追加：Cookieを確認
  const cookieStore = await cookies()
  const isRealOnly = cookieStore.get('filter_mode')?.value !== 'all'

  // ★変更：モードによって使うViewを変える
  const viewName = isRealOnly ? 'song_counts_real_users' : 'song_counts'
  
  // 集計済みのViewから、このアーティストの曲を取得
  const { data: songList } = await supabase
    .from(viewName) // 変数でViewを指定
    .select('*')
    .eq('artist', decodedArtistName)
    .order('vote_count', { ascending: false })   // 第1優先：得票数（多い順）
    .order('last_updated', { ascending: false }) // 第2優先：更新日時（新しい順）
  
  if (!songList) return <div>データが見つかりません</div>

return (
    <div style={{ maxWidth: '800px', margin: '50px auto', fontFamily: 'sans-serif' }}>
      
      {/* ナビゲーションエリア */}
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        
        {/* 左側：リンクを縦に並べる箱 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Link href="/" style={{ textDecoration: 'none', color: '#666', fontSize: '0.9em' }}>
            ← 自分の箱舟に戻る
          </Link>
          <Link href="/songs" style={{ textDecoration: 'none', color: '#666', fontSize: '0.9em' }}>
            ← リストに戻る
          </Link>
        </div>
        
        {/* 右側：スイッチ（そのまま） */}
        <FilterToggleButton isRealOnly={isRealOnly} />
      </div>

      <h1>{decodedArtistName}</h1>
      <p style={{ marginBottom: '30px' }}>登録されている曲の一覧</p>

      <ul style={{ listStyle: 'none', padding: 0 }}>
        {songList.map((item) => (
          <li key={item.song} style={{ borderBottom: '1px solid #eee', padding: '15px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {/* 左側：曲名と情報 */}
            <div>
              <span style={{ fontWeight: 'bold', fontSize: '1.2em', marginRight: '10px' }}>
                {item.song}
              </span>
              <span style={{ fontSize: '0.9em', color: '#666', background: '#eee', padding: '2px 6px', borderRadius: '4px' }}>
                {item.vote_count}人が登録
              </span>
            </div>
            
            {/* 右側：ボタンエリア（YouTubeと箱舟ボタンを横並びにする） */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              {/* YouTube検索ボタン */}
              <a 
                href={`https://www.youtube.com/results?search_query=${encodeURIComponent(decodedArtistName + ' ' + item.song)}`}
                target="_blank" 
                rel="noopener noreferrer"
                style={{ 
                  fontSize: '12px', 
                  color: '#d32f2f', // YouTubeっぽい赤色
                  textDecoration: 'none', 
                  border: '1px solid #d32f2f', 
                  padding: '4px 8px', 
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                ▶ YouTube
              </a>

              {/* 箱舟に乗せるボタン */}
              <AddToArkButton artist={decodedArtistName} song={item.song} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}