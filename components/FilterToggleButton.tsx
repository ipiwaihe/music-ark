'use client'

import { toggleFilterMode } from '@/app/actions'

export default function FilterToggleButton({ isRealOnly }: { isRealOnly: boolean }) {
  return (
    <button
      onClick={() => toggleFilterMode()}
      style={{
        fontSize: '12px',
        padding: '6px 12px',
        background: isRealOnly ? '#0070f3' : '#f0f0f0', // ONなら青、OFFならグレー
        color: isRealOnly ? 'white' : 'black',
        border: 'none',
        borderRadius: '20px',
        cursor: 'pointer',
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        transition: 'all 0.2s'
      }}
    >
      <span style={{ fontSize: '14px' }}>
        {isRealOnly ? '👤' : '🤖'}
      </span>
      {isRealOnly ? 'ユーザ投稿のみ' : '全データ表示中'}
    </button>
  )
}