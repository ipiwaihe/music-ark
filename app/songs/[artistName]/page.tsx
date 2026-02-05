import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import AddToArkButton from '@/components/AddToArkButton'

type Props = {
  params: Promise<{ artistName: string }>
}

export default async function ArtistPage({ params }: Props) {
  const { artistName } = await params
  const decodedArtistName = decodeURIComponent(artistName)
  const supabase = await createClient()

  // 集計済みのViewから、このアーティストの曲を取得
  const { data: songList } = await supabase
    .from('song_counts')
    .select('*')
    .eq('artist', decodedArtistName)
    .order('vote_count', { ascending: false })

  if (!songList) return <div>データが見つかりません</div>

  return (
    <div style={{ maxWidth: '800px', margin: '50px auto', fontFamily: 'sans-serif' }}>
      <div style={{ marginBottom: '20px' }}>
        <Link href="/songs" style={{ textDecoration: 'none', color: '#666' }}>← リストに戻る</Link>
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