'use client'

import { upsertVote } from '@/app/actions'
import { useState } from 'react'

export default function AddToArkButton({ artist, song }: { artist: string, song: string }) {
  const [isLoading, setIsLoading] = useState(false)

  async function handleAdd() {
    setIsLoading(true)
    try {
      // プログラムの中で擬似的にフォームデータを作る
      const formData = new FormData()
      formData.append('artist', artist)
      formData.append('song', song)
      formData.append('comment', '') // コメントは空で

      // 1. 保存実行（上書き禁止モード）
      const result = await upsertVote(formData, false)

      // 2. 結果判定
      if (result?.status === 'confirm_needed') {
        const isConfirmed = confirm(`あなたの箱舟には既に「${artist}」が登録されています。\nこの曲（${song}）に書き換えますか？`)
        if (isConfirmed) {
          await upsertVote(formData, true) // 強制上書き
          alert('箱舟の曲を書き換えました！')
        }
      } else if (result?.status === 'success') {
        alert('箱舟に乗せました！')
      } else if (result?.status === 'error') {
        alert('エラー: ' + result.message)
      }
    } catch (e) {
      console.error(e)
      alert('エラーが発生しました')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button 
      onClick={handleAdd}
      disabled={isLoading}
      style={{ 
        padding: '5px 10px', 
        fontSize: '12px', 
        background: isLoading ? '#ccc' : 'black', 
        color: 'white', 
        border: 'none', 
        borderRadius: '4px',
        cursor: 'pointer',
        whiteSpace: 'nowrap'
      }}
    >
      {isLoading ? '...' : '箱舟に乗せる'}
    </button>
  )
}