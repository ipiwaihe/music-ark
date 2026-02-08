import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { cookies } from 'next/headers'
import FilterToggleButton from '@/components/FilterToggleButton'
import ArtistListClient from '@/components/ArtistListClient'

export type ArtistRanking = {
  artist: string
  total_score: number
  vote_count: number
  top_song: string | null
  last_updated: string
}

export default async function SongsListPage() {
  const supabase = await createClient()
  const cookieStore = await cookies()
  
  // 1. ログインユーザ情報の取得
  const { data: { user } } = await supabase.auth.getUser()

  // 2. モード設定
  const isRealOnly = cookieStore.get('filter_mode')?.value !== 'all'
  const viewName = isRealOnly ? 'artist_rankings_real' : 'artist_rankings'

  // 3. 一覧の取得
  // ★変更: スコア順ではなく、アーティスト名順で取得
  const { data: artistList, error } = await supabase
    .from(viewName)
    .select('*')
    .order('artist', { ascending: true }) // アルファベット順（The抜きはクライアント側で補正）

  if (error) {
    console.error('Data fetch error:', error)
    return <div>データ読み込みエラー</div>
  }

  // 4. 自分が投票済みのアーティスト名を取得
  let myVotedArtists: string[] = []
  if (user) {
    const { data: myVotes } = await supabase
      .from('votes')
      .select('artist')
      .eq('user_id', user.id)
    
    if (myVotes) {
      myVotedArtists = myVotes.map(v => v.artist)
    }
  }

  return (
    <div style={{ maxWidth: '800px', margin: '50px auto', fontFamily: 'sans-serif', padding: '0 20px' }}>
      
      {/* ナビゲーション */}
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href="/" style={{ textDecoration: 'none', color: '#666' }}>← 自分の箱舟に戻る</Link>
        <FilterToggleButton isRealOnly={isRealOnly} />
      </div>
      
      <h1>音楽の箱舟 みんなのリスト</h1>
      <p style={{ marginBottom: '20px', fontSize: '0.9em', color: '#666' }}>
        {isRealOnly 
          ? '【ユーザ投稿のみ】 実際にユーザーが投票したデータのみのリストです。' 
          : '【全データ】 Spotifyの人気曲データ（手入力）も含めたリストです。'}
      </p>

      {/* リスト表示 */}
      <ArtistListClient 
        initialArtists={(artistList as ArtistRanking[]) || []} 
        myVotedArtists={myVotedArtists} 
      />

    </div>
  )
}