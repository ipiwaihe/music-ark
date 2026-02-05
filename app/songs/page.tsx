import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { cookies } from 'next/headers' // ★追加
import FilterToggleButton from '@/components/FilterToggleButton' // ★追加

export default async function SongsListPage() {
  const supabase = await createClient()

  // ★追加：Cookieを確認
  const cookieStore = await cookies()
  const isRealOnly = cookieStore.get('filter_mode')?.value !== 'all'

  // ★変更：モードによって使うViewを変える
  const viewName = isRealOnly ? 'artist_leaders_real_users' : 'artist_leaders'

  // ★変更：集計済みのViewから取得するだけ！JSでの計算ロジックは全削除！
  const { data: artistList } = await supabase
    .from(viewName) // 変数でViewを指定
    .select('*')
    .order('artist', { ascending: true })

  if (!artistList) return <div>データがありません</div>

  return (
    <div style={{ maxWidth: '800px', margin: '50px auto', fontFamily: 'sans-serif' }}>
      
      {/* ナビゲーションエリアをFlexboxで整列 */}
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href="/" style={{ textDecoration: 'none', color: '#666' }}>← 自分の箱舟に戻る</Link>
        
        {/* ★ここにスイッチを配置 */}
        <FilterToggleButton isRealOnly={isRealOnly} />
      </div>
      
      <h1>登録アーティスト一覧</h1>
      {/* メッセージも少し親切に切り替え */}
      <p style={{ marginBottom: '30px' }}>
        {isRealOnly 
          ? 'ユーザが登録したアーティストのみ表示しています。' 
          : 'Spotify人気曲データ(手入力)を含む、全てのアーティストを表示しています。'}
      </p>

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