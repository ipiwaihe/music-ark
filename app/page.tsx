import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Dashboard from '@/components/Dashboard' // 作った部品を読み込み

export default async function Home() {
  const supabase = await createClient()
  
  // 1. ログインチェック
  const { data: { user } } = await supabase.auth.getUser()

  // 2. データの取得
  // ・自分のデータだけ (eq user_id)
  // ・アーティスト名順 (order artist)
  const { data: votes } = await supabase
    .from('votes')
    .select('*')
    .eq('user_id', user?.id || '') // ログインしてない時は空文字で検索（ヒットしない）
    .order('artist', { ascending: true })

  // ログインしていない時の表示
  if (!user) {
    return (
      <div style={{ textAlign: 'center', marginTop: '100px', fontFamily: 'sans-serif' }}>
        <h1>音楽版ノアの箱舟</h1>
        <p>利用するにはログインしてください</p>
        <a href="/login" style={{ display: 'inline-block', marginTop: '20px', padding: '10px 20px', background: 'black', color: 'white', textDecoration: 'none', borderRadius: '4px' }}>
          ログイン画面へ
        </a>
      </div>
    )
  }

  // ログインしている時の表示
  return (
    <div style={{ maxWidth: '600px', margin: '50px auto', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>音楽の箱舟</h1>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {/* ★追加：みんなのリストへのリンクボタン */}
          <a href="/songs" style={{ fontSize: '14px', textDecoration: 'none', color: 'black', border: '1px solid black', padding: '5px 10px', borderRadius: '4px' }}>
            みんなのリストを見る
          </a>

          {/* ログアウトボタン（既存） */}
          {user && (
            <form action={async () => {
              'use server'
              const supabase = await createClient()
              await supabase.auth.signOut()
              redirect('/login')
            }}>
              <button style={{ fontSize: '12px', padding: '5px 10px', cursor: 'pointer', background: 'none', border: 'none', textDecoration: 'underline' }}>ログアウト</button>
            </form>
          )}
        </div>
      </div>

      {/* ここにさっき作った高機能な部品を表示！ */}
      <Dashboard initialVotes={votes || []} />
    </div>
  )
}