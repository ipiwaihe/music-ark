'use client'

import { useState } from 'react'
import { upsertVote, deleteVote, toggleVoteFlag } from '@/app/actions' // ★追加
import Link from 'next/link'

type Vote = {
  id: number
  artist: string
  song: string
  comment: string | null
  // ▼ 追加
  is_knowledgeable: boolean 
  is_passionate: boolean
}

export default function Dashboard({ initialVotes }: { initialVotes: Vote[] }) {
  const [artist, setArtist] = useState('')
  const [song, setSong] = useState('')
  const [comment, setComment] = useState('')
  // ▼ フラグのstate
  const [isKnowledgeable, setIsKnowledgeable] = useState(false)
  const [isPassionate, setIsPassionate] = useState(false)

  const [isLoading, setIsLoading] = useState(false)

  // ★フォーム送信時の処理
  async function onSubmitHandler(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault() 
    if (isLoading) return 
    
    setIsLoading(true)
    
    try {
      const formData = new FormData(e.currentTarget)
      
      // ★重要：チェックボックスの状態を明示的にFormDataに上書きする
      // (HTMLの標準動作だと、チェックOFFの時にデータが送信されないため)
      formData.set('is_knowledgeable', isKnowledgeable.toString()) // "true" or "false"
      formData.set('is_passionate', isPassionate.toString())       // "true" or "false"
      
      console.log('送信データ:', Object.fromEntries(formData))

      // 1. 保存実行
      const result = await upsertVote(formData, false)

      // 2. 結果に応じた処理
      if (result?.status === 'confirm_needed') {
        const isConfirmed = confirm(result.message)
        
        if (isConfirmed) {
          // OKなら「強制上書きモード」で再実行
          await upsertVote(formData, true)
          alert('書き換えました！')
          resetForm()
        }
      } else if (result?.status === 'success') {
        alert('保存しました！')
        resetForm()
      } else if (result?.status === 'error') {
        alert('エラーが発生しました: ' + result.message)
      }
    } catch (err) {
      console.error(err)
      alert('予期せぬエラーが発生しました。')
    } finally {
      setIsLoading(false)
    }
  }

  // 削除ボタンの処理
  async function handleDelete() {
    if (!artist) return alert('アーティスト名が入力されていません')
    
    const isConfirmed = confirm(`本当に「${artist}」のデータを削除してもいいですか？\n（箱舟から降ろします）`)
    if (isConfirmed) {
      setIsLoading(true)
      await deleteVote(artist)
      alert('削除しました')
      resetForm()
      setIsLoading(false)
    }
  }

  // ★追加：リスト上のアイコンクリックでフラグを切り替える処理
  async function handleToggle(voteId: number, field: 'is_knowledgeable' | 'is_passionate', currentValue: boolean) {
    // 楽観的UI更新（サーバー応答を待たずに成功したと仮定しても良いが、今回はシンプルにサーバー処理後にリロードされるのを待つ）
    // ※Next.jsのServer Actions + revalidatePathなら自動で画面が最新になります
    const result = await toggleVoteFlag(voteId, field, !currentValue)
    if (result.status === 'error') {
      alert('更新できませんでした')
    }
  }

  // フォームのリセット
  function resetForm() {
    setArtist('')
    setSong('')
    setComment('')
    // ★フラグもデフォルトに戻す
    setIsKnowledgeable(false)
    setIsPassionate(false)
  }

  return (
    <div>
      <div style={{ background: '#f9f9f9', padding: '20px', borderRadius: '8px', marginBottom: '30px' }}>
        <form onSubmit={onSubmitHandler} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          
          {/* アーティスト名 */}
          <div>
            <label style={{fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '5px'}}>アーティスト名</label>
            <input 
              name="artist" 
              value={artist} 
              onChange={(e) => setArtist(e.target.value)} 
              placeholder="例: The Beatles" 
              required 
              maxLength={100}
              style={{ padding: '10px', fontSize: '16px', width: '100%', boxSizing: 'border-box' }} 
            />
          </div>
          
          {/* 曲名 */}
          <div>
            <label style={{fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '5px'}}>曲名</label>
            <input 
              name="song" 
              value={song} 
              onChange={(e) => setSong(e.target.value)} 
              placeholder="例: Across the Universe" 
              required 
              maxLength={100}
              style={{ padding: '10px', fontSize: '16px', width: '100%', boxSizing: 'border-box' }} 
            />
          </div>

          {/* ▼▼▼ 追加：知識・熱量フラグ ▼▼▼ */}
          <div style={{ background: '#fff', padding: '15px', borderRadius: '6px', border: '1px solid #ddd', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            
            {/* 1. 知識フラグ */}
            <label style={{ display: 'flex', gap: '10px', cursor: 'pointer', alignItems: 'flex-start' }}>
              <input 
                type="checkbox" 
                checked={isKnowledgeable}
                onChange={(e) => setIsKnowledgeable(e.target.checked)}
                style={{ transform: 'scale(1.2)', marginTop: '3px' }}
              />
              <span style={{ fontSize: '14px', color: isKnowledgeable ? 'black' : '#888', fontWeight: isKnowledgeable ? 'bold' : 'normal' }}>
                {isKnowledgeable 
                  ? "このアーティストについて、ファンである・ある程度曲を知っている。" 
                  : "このアーティストについて、あまり詳しくない（あまり曲を知らない）。"}
              </span>
            </label>

            <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: 0 }} />

            {/* 2. 熱量フラグ */}
            <label style={{ display: 'flex', gap: '10px', cursor: 'pointer', alignItems: 'flex-start' }}>
              <input 
                type="checkbox" 
                checked={isPassionate}
                onChange={(e) => setIsPassionate(e.target.checked)}
                style={{ transform: 'scale(1.2)', marginTop: '3px' }}
              />
              <span style={{ fontSize: '14px', color: isPassionate ? 'black' : '#888', fontWeight: isPassionate ? 'bold' : 'normal' }}>
                {isPassionate 
                  ? "この曲は、結構こだわりのお気に入り曲。" 
                  : "1曲選ぶならこれだけど、そこまでこだわりは無いかも。"}
              </span>
            </label>
          </div>
          {/* ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲ */}

          {/* コメント */}
          <div>
            <label style={{fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '5px'}}>コメント</label>
            <textarea 
              name="comment" 
              value={comment} 
              onChange={(e) => setComment(e.target.value)} 
              placeholder="推薦コメント（140文字まで）" 
              maxLength={140}
              style={{ padding: '10px', fontSize: '16px', height: '80px', width: '100%', boxSizing: 'border-box' }} 
            />
          </div>

          {/* ボタンエリア */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button 
              type="submit" 
              disabled={isLoading}
              style={{ flex: 2, padding: '12px', background: isLoading ? '#999' : 'black', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold', borderRadius: '4px' }}
            >
              {isLoading ? '通信中...' : '箱舟に乗せる（保存）'}
            </button>
            
            <button 
              type="button" 
              onClick={handleDelete}
              disabled={!artist || isLoading}
              style={{ flex: 1, padding: '12px', background: (!artist || isLoading) ? '#ccc' : '#d32f2f', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '4px' }}
            >
              降ろす
            </button>
          </div>
        </form>
      </div>
      
      {/* --- リスト表示 --- */}
      <h2>あなたの登録リスト（{initialVotes.length}曲）</h2>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {initialVotes.map((vote) => (
          <li key={vote.id} style={{ borderBottom: '1px solid #ddd', padding: '10px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            
            {/* 左側：アーティストと曲名 */}
            <div 
              title={vote.comment || 'コメントなし'}
              style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}
            >
              <Link 
                href={`/songs/${encodeURIComponent(vote.artist)}`}
                style={{ 
                  fontWeight: 'bold', 
                  fontSize: '1.1em', 
                  whiteSpace: 'nowrap',
                  color: 'black',
                  textDecoration: 'underline'
                }}
              >
                {vote.artist}
              </Link>

              <span style={{ color: '#888' }}>/</span>
              
              <span style={{ fontSize: '1.1em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {vote.song}
              </span>
              
              {/* ▼▼▼ 修正: クリックで切り替わるアイコン群 ▼▼▼ */}
              <div style={{ display: 'flex', gap: '4px', marginLeft: '10px' }}>
                {/* 知識フラグ */}
                <button
                  type="button"
                  onClick={() => handleToggle(vote.id, 'is_knowledgeable', vote.is_knowledgeable)}
                  title={vote.is_knowledgeable ? "知識あり" : "詳しくない"}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2em',
                    opacity: vote.is_knowledgeable ? 1 : 0.3 // Falseなら薄くする
                  }}
                >
                  {vote.is_knowledgeable ? '🎓' : '✖'}
                </button>

                {/* 熱量フラグ */}
                <button
                  type="button"
                  onClick={() => handleToggle(vote.id, 'is_passionate', vote.is_passionate)}
                  title={vote.is_passionate ? "熱量あり" : "こだわり薄"}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2em',
                    opacity: vote.is_passionate ? 1 : 0.3 // Falseなら薄くする
                  }}
                >
                  {vote.is_passionate ? '❤️' : '✖'}
                </button>
              </div>
              {/* ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲ */}
            </div>

            {/* 右側：変更ボタン */}
            <button 
              onClick={() => {
                setArtist(vote.artist)
                setSong(vote.song)
                setComment(vote.comment || '')
                // ★編集時、フラグの状態もフォームに反映させる
                setIsKnowledgeable(vote.is_knowledgeable)
                setIsPassionate(vote.is_passionate)
                
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              style={{ padding: '5px 10px', fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap', marginLeft: '10px', background: '#eee', border: '1px solid #ccc', borderRadius: '4px' }}
            >
              編集
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}