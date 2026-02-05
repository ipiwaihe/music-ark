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

  // ★変更：集計済みのViewから、このアーティストの曲だけを取得
  const { data: songList } = await supabase
    .from('song_counts') // 集計済みView
    .select('*')
    .eq('artist', decodedArtistName)
    .order('vote_count', { ascending: false }) // 人気順

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
            <div>
              <span style={{ fontWeight: 'bold', fontSize: '1.2em', marginRight: '10px' }}>
                {item.song}
              </span>
              <span style={{ fontSize: '0.9em', color: '#666', background: '#eee', padding: '2px 6px', borderRadius: '4px' }}>
                {item.vote_count}人が登録
              </span>
            </div>
            
            <AddToArkButton artist={decodedArtistName} song={item.song} />
          </li>
        ))}
      </ul>
    </div>
  )
}