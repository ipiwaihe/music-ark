'use client'

import { useState } from 'react'
import { upsertVote, deleteVote } from '@/app/actions'
import Link from 'next/link' // ★追加：リンク機能を使う準備

type Vote = {
  id: number
  artist: string
  song: string
  comment: string | null
}

export default function Dashboard({ initialVotes }: { initialVotes: Vote[] }) {
  const [artist, setArtist] = useState('')
  const [song, setSong] = useState('')
  const [comment, setComment] = useState('')
  const [isLoading, setIsLoading] = useState(false) // ★追加：連打防止用

  // ★変更：フォーム送信時の処理（より確実な書き方）
  async function onSubmitHandler(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault() // 画面のリロードを防ぐ
    if (isLoading) return // 連打防止
    
    setIsLoading(true)
    
    try {
      // フォームのデータを吸い出す
      const formData = new FormData(e.currentTarget)
      
      // 1. 保存実行（上書き禁止モード）
      console.log('送信開始:', Object.fromEntries(formData)) // 動作確認ログ
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
      alert('予期せぬエラーが発生しました。コンソールを確認してください。')
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

  function resetForm() {
    setArtist('')
    setSong('')
    setComment('')
  }

  return (
    <div>
      <div style={{ background: '#f9f9f9', padding: '20px', borderRadius: '8px', marginBottom: '30px' }}>
        {/* ★ここを変更：action={...} ではなく onSubmit={...} にする */}
        <form onSubmit={onSubmitHandler} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          
          <label style={{fontSize: '12px', fontWeight: 'bold'}}>アーティスト名</label>
          <input 
            name="artist" 
            value={artist} 
            onChange={(e) => setArtist(e.target.value)} 
            placeholder="例: The Beatles" 
            required 
            maxLength={100} // ★追加：100文字まで
            style={{ padding: '10px', fontSize: '16px' }} 
          />
          
          <label style={{fontSize: '12px', fontWeight: 'bold'}}>曲名</label>
          <input 
            name="song" 
            value={song} 
            onChange={(e) => setSong(e.target.value)} 
            placeholder="例: Across the Universe" 
            required 
            maxLength={100} // ★追加：100文字まで
            style={{ padding: '10px', fontSize: '16px' }} 
          />
          
          <label style={{fontSize: '12px', fontWeight: 'bold'}}>コメント</label>
          <textarea 
            name="comment" 
            value={comment} 
            onChange={(e) => setComment(e.target.value)} 
            placeholder="推薦コメント" 
            maxLength={140} // ★追加：140文字まで
            style={{ padding: '10px', fontSize: '16px', height: '80px' }} 
          />

          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button 
              type="submit" 
              disabled={isLoading} // 送信中はボタンを押せないようにする
              style={{ flex: 2, padding: '12px', background: isLoading ? '#999' : 'black', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
            >
              {isLoading ? '通信中...' : '箱舟に乗せる（保存）'}
            </button>
            
            <button 
              type="button" 
              onClick={handleDelete}
              disabled={!artist || isLoading}
              style={{ flex: 1, padding: '12px', background: (!artist || isLoading) ? '#ccc' : '#d32f2f', color: 'white', border: 'none', cursor: 'pointer' }}
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
              {/* ★変更：ここをspanからLinkに変えるだけ！ */}
              <Link 
                href={`/songs/${encodeURIComponent(vote.artist)}`}
                style={{ 
                  fontWeight: 'bold', 
                  fontSize: '1.1em', 
                  whiteSpace: 'nowrap',
                  color: 'black',             // リンクの色（黒にしておく）
                  textDecoration: 'underline' // リンクっぽく下線をつける
                }}
              >
                {vote.artist}
              </Link>

              <span style={{ color: '#888' }}>/</span>
              
              <span style={{ fontSize: '1.1em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {vote.song}
              </span>
            </div>

            {/* 右側：変更ボタン（そのまま） */}
            <button 
              onClick={() => {
                setArtist(vote.artist)
                setSong(vote.song)
                setComment(vote.comment || '')
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