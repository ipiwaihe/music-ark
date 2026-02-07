'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'

type ArtistData = {
  artist: string
  top_song?: string
  vote_count: number
}

type Props = {
  initialArtists: ArtistData[]
  myVotedArtists: string[]
}

const ITEMS_PER_PAGE = 50

export default function ArtistListClient({ initialArtists, myVotedArtists }: Props) {
  const [filterUnvoted, setFilterUnvoted] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  const filteredArtists = useMemo(() => {
    let result = initialArtists
    if (filterUnvoted) {
      result = result.filter(item => !myVotedArtists.includes(item.artist))
    }
    return result
  }, [initialArtists, myVotedArtists, filterUnvoted])

  const totalPages = Math.ceil(filteredArtists.length / ITEMS_PER_PAGE)
  
  const currentArtists = filteredArtists.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const handleFilterChange = (checked: boolean) => {
    setFilterUnvoted(checked)
    setCurrentPage(1)
  }

  // ★追加：ページネーション部品を生成する関数（再利用するため）
  const renderPagination = () => {
    if (totalPages <= 1) return null

    return (
      <div style={{ margin: '20px 0', display: 'flex', flexWrap: 'wrap', gap: '5px', justifyContent: 'center' }}>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
          const startIdx = (page - 1) * ITEMS_PER_PAGE
          const endIdx = Math.min(page * ITEMS_PER_PAGE, filteredArtists.length) - 1
          
          // データが存在するか確認してから頭文字を取得
          const startChar = filteredArtists[startIdx]?.artist ? filteredArtists[startIdx].artist.charAt(0) : '?'
          const endChar = filteredArtists[endIdx]?.artist ? filteredArtists[endIdx].artist.charAt(0) : '?'
          
          return (
            <button
              key={page}
              onClick={() => {
                setCurrentPage(page)
                // ページ切り替え時に上までスクロール（お好みで削除可）
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
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
    )
  }

  return (
    <div>
      {/* --- コントロールエリア --- */}
      <div style={{ marginBottom: '10px', padding: '15px', background: '#f9f9f9', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
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
          {filteredArtists.length} 件
        </span>
      </div>

      {/* ★追加：リストの上にもページネーションを表示 */}
      {renderPagination()}

      {/* --- リスト表示 --- */}
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {currentArtists.map((item) => (
          <li key={item.artist} style={{ borderBottom: '1px solid #eee', padding: '15px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Link href={`/songs/${encodeURIComponent(item.artist)}`} style={{ fontWeight: 'bold', fontSize: '1.2em', textDecoration: 'none', color: '#0070f3' }}>
                {item.artist}
              </Link>
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

      {/* --- 下部ページネーション --- */}
      {renderPagination()}

    </div>
  )
}