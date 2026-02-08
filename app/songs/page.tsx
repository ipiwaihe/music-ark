import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { cookies } from 'next/headers' // ★復活
import FilterToggleButton from '@/components/FilterToggleButton' // ★復活
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
  const cookieStore = await cookies() // ★復活
  
  // 1. ログインユーザ情報の取得
  const { data: { user } } = await supabase.auth.getUser()

  // 2. ★復活：モード設定（Cookieを見てViewを切り替える）
  const isRealOnly = cookieStore.get('filter_mode')?.value !== 'all'
  // 新しく作ったランキング用Viewを使い分ける
  const viewName = isRealOnly ? 'artist_rankings_real' : 'artist_rankings'

  // 3. ランキング一覧の取得
  const { data: artistList, error } = await supabase
    .from(viewName) // ★切り替えたViewから取得
    .select('*')
    .order('total_score', { ascending: false }) // スコア順
    .order('last_updated', { ascending: false })

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
        {/* ★復活：トグルボタン */}
        <FilterToggleButton isRealOnly={isRealOnly} />
      </div>
      
      <h1>音楽の箱舟 みんなのリスト</h1>
      <p style={{ marginBottom: '20px', fontSize: '0.9em', color: '#666' }}>
        {isRealOnly 
          ? '【リアルユーザー限定】 実際にユーザーが投票した熱量の高いランキングです。' 
          : '【全データ】 Spotifyの人気曲データなども含めた総合ランキングです。'}
      </p>

      {/* リスト表示（中身は新ランキングロジック） */}
      <ArtistListClient 
        initialArtists={(artistList as ArtistRanking[]) || []} 
        myVotedArtists={myVotedArtists} 
      />

    </div>
  )
}