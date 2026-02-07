import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { cookies } from 'next/headers'
import FilterToggleButton from '@/components/FilterToggleButton'
import ArtistListClient from '@/components/ArtistListClient' // ★追加

export default async function SongsListPage() {
  const supabase = await createClient()
  const cookieStore = await cookies()
  
  // 1. ログインユーザ情報の取得
  const { data: { user } } = await supabase.auth.getUser()

  // 2. モード設定
  const isRealOnly = cookieStore.get('filter_mode')?.value !== 'all'
  const viewName = isRealOnly ? 'artist_leaders_real_users' : 'artist_leaders'

  // 3. アーティスト一覧の取得
  const { data: artistList } = await supabase
    .from(viewName)
    .select('*')
    .order('artist', { ascending: true }) // アルファベット順にしておくとページネーションが綺麗です

  // 4. ★追加：自分が投票済みのアーティスト名を取得
  let myVotedArtists: string[] = []
  if (user) {
    const { data: myVotes } = await supabase
      .from('votes')
      .select('artist')
      .eq('user_id', user.id)
    
    if (myVotes) {
      // オブジェクトの配列を文字列の配列に変換 ['ArtistA', 'ArtistB']
      myVotedArtists = myVotes.map(v => v.artist)
    }
  }

  if (!artistList) return <div>データ読み込みエラー</div>

  return (
    <div style={{ maxWidth: '800px', margin: '50px auto', fontFamily: 'sans-serif' }}>
      
      {/* ナビゲーション */}
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href="/" style={{ textDecoration: 'none', color: '#666' }}>← 自分の箱舟に戻る</Link>
        <FilterToggleButton isRealOnly={isRealOnly} />
      </div>
      
      <h1>登録アーティスト一覧</h1>
      <p style={{ marginBottom: '20px' }}>
        {isRealOnly 
          ? 'ユーザが登録したアーティストのみ表示しています。' 
          : 'Spotify人気曲データを含む、全てのアーティストを表示しています。'}
      </p>

      {/* ★リスト表示をClient Componentに委譲 */}
      <ArtistListClient 
        initialArtists={artistList} 
        myVotedArtists={myVotedArtists} 
      />

    </div>
  )
}