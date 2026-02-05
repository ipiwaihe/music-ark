import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'

export default async function SongsListPage() {
  const supabase = await createClient()

  // ★変更：集計済みのViewから取得するだけ！JSでの計算ロジックは全削除！
  const { data: artistList } = await supabase
    .from('artist_leaders') // さっき作ったView
    .select('*')
    .order('artist', { ascending: true }) // 名前順

  if (!artistList) return <div>データがありません</div>

  return (
    <div style={{ maxWidth: '800px', margin: '50px auto', fontFamily: 'sans-serif' }}>
      <div style={{ marginBottom: '20px' }}>
        <Link href="/" style={{ textDecoration: 'none', color: '#666' }}>← 自分の箱舟に戻る</Link>
      </div>
      
      <h1>登録アーティスト一覧</h1>
      <p style={{ marginBottom: '30px' }}>みんなが箱舟に乗せたアーティストたちです。</p>

      <ul style={{ listStyle: 'none', padding: 0 }}>
        {artistList.map((item) => (
          <li key={item.artist} style={{ borderBottom: '1px solid #eee', padding: '15px 0' }}>
            <Link 
              href={`/songs/${encodeURIComponent(item.artist)}`} 
              style={{ textDecoration: 'none', color: 'inherit', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <div style={{ flex: 1 }}>
                <span style={{ fontWeight: 'bold', fontSize: '1.2em', marginRight: '10px' }}>
                  {item.artist}
                </span>
                <span style={{ color: '#666', fontSize: '0.9em' }}>
                  代表曲: {item.top_song} {/* Viewのカラム名に合わせる */}
                </span>
              </div>
              <span style={{ color: '#999' }}>ᐳ</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}