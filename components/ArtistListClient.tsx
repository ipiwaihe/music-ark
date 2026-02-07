'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import AddToArkButton from '@/components/AddToArkButton'

type ArtistData = {
  artist: string
  top_song?: string
  vote_count: number
}

type Props = {
  initialArtists: ArtistData[] // 全アーティストデータ
  myVotedArtists: string[]     // 自分が投票済みのアーティスト名リスト
}

const ITEMS_PER_PAGE = 50 // 1ページあたりの表示件数

export default function ArtistListClient({ initialArtists, myVotedArtists }: Props) {
  const [filterUnvoted, setFilterUnvoted] = useState(false) // 未登録のみフィルター
  const [currentPage, setCurrentPage] = useState(1)         // 現在のページ

  // ■ フィルタリング処理
  const filteredArtists = useMemo(() => {
    let result = initialArtists

    // 「未登録のみ」がONなら、自分のリストにあるやつを除外
    if (filterUnvoted) {
      result = result.filter(item => !myVotedArtists.includes(item.artist))
    }
    
    return result
  }, [initialArtists, myVotedArtists, filterUnvoted])

  // ■ ページネーション計算
  const totalPages = Math.ceil(filteredArtists.length / ITEMS_PER_PAGE)
  
  // ページが変わったらスクロールを一番上に戻すなどの処理はお好みで
  // 現在のページに表示するデータ
  const currentArtists = filteredArtists.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  // ページ切り替え時にページ1に戻す（フィルタが変わった時など）
  const handleFilterChange = (checked: boolean) => {
    setFilterUnvoted(checked)
    setCurrentPage(1)
  }

  return (
    <div>
      {/* --- コントロールエリア --- */}
      <div style={{ marginBottom: '20px', padding: '15px', background: '#f9f9f9', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <input
          type="checkbox"
          id="filterUnvoted"
          checked={filterUnvoted}
          onChange={(e) => handleFilterChange(e.target.checked)}
          style={{ transform: 'scale(1.2)', cursor: 'pointer' }}
        />
        <label htmlFor="filterUnvoted" style={{ cursor: 'pointer', fontWeight: 'bold' }}>
          自分がまだ登録していないアーティストのみ表示
        </label>
        <span style={{ marginLeft: 'auto', fontSize: '0.9em', color: '#666' }}>
          {filteredArtists.length} 件ヒット
        </span>
      </div>

      {/* --- リスト表示 --- */}
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {currentArtists.map((item) => (
          <li key={item.artist} style={{ borderBottom: '1px solid #eee', padding: '15px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Link href={`/songs/${encodeURIComponent(item.artist)}`} style={{ fontWeight: 'bold', fontSize: '1.2em', textDecoration: 'none', color: '#0070f3' }}>
                {item.artist}
              </Link>
              {/* 自分が投票済みならマークを出す */}
              {myVotedArtists.includes(item.artist) && (
                <span style={{ fontSize: '0.8em', background: '#e0ffe0', color: '#008000', padding: '2px 6px', borderRadius: '4px' }}>
                  登録済
                </span>
              )}
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.9em', color: '#666' }}>
                <span style={{ fontWeight: 'bold' }}>{item.vote_count}</span>票
              </div>
              <div style={{ fontSize: '0.8em', color: '#888' }}>
                代表曲: {item.top_song || '(まだなし)'}
              </div>
            </div>
          </li>
        ))}
      </ul>

      {/* --- ページネーション（ホバーで範囲表示） --- */}
      {totalPages > 1 && (
        <div style={{ marginTop: '30px', display: 'flex', flexWrap: 'wrap', gap: '5px', justifyContent: 'center' }}>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
            // このページの先頭と末尾のデータを確認
            const startIdx = (page - 1) * ITEMS_PER_PAGE
            const endIdx = Math.min(page * ITEMS_PER_PAGE, filteredArtists.length) - 1
            const startChar = filteredArtists[startIdx]?.artist.charAt(0) || '?'
            const endChar = filteredArtists[endIdx]?.artist.charAt(0) || '?'
            
            return (
              <button
                key={page}
                onClick={() => {
                  setCurrentPage(page)
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                // ★ここがポイント：ホバー時のツールチップ
                title={`${startChar} ... ${endChar}`} 
                style={{
                  padding: '8px 12px',
                  border: '1px solid #ccc',
                  background: currentPage === page ? 'black' : 'white',
                  color: currentPage === page ? 'white' : 'black',
                  cursor: 'pointer',
                  borderRadius: '4px'
                }}
              >
                {page}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}