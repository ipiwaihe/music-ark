'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'

// 型定義：ランキングViewから返ってくるデータ構造に合わせる
type ArtistRanking = {
  artist: string
  total_score: number
  vote_count: number
  top_song: string | null
  last_updated: string
}

type Props = {
  initialArtists: ArtistRanking[]
  myVotedArtists: string[]
}

const ITEMS_PER_PAGE = 50

export default function ArtistListClient({ initialArtists, myVotedArtists }: Props) {
  const [filterUnvoted, setFilterUnvoted] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  // The抜きソート用のヘルパー
  const getSortName = (name: string) => {
    const lowerName = name.toLowerCase()
    if (lowerName.startsWith('the ')) return lowerName.slice(4) + ', the'
    return lowerName
  }

  // フィルタリング & ソートロジック
  const filteredArtists = useMemo(() => {
    let result = [...initialArtists]

    // (A) 未登録フィルター
    if (filterUnvoted) {
      result = result.filter(item => !myVotedArtists.includes(item.artist))
    }
    
    // (B) ソート処理：サーバー側ですでにスコア順だが、念のためクライアントでも保証
    result.sort((a, b) => {
      // 1. スコア順（大きい方が上）
      if (a.total_score > b.total_score) return -1
      if (a.total_score < b.total_score) return 1

      // 2. 更新日（新しい方が上）
      if (a.last_updated > b.last_updated) return -1
      if (a.last_updated < b.last_updated) return 1

      // 3. 名前順（The抜き）
      const nameA = getSortName(a.artist)
      const nameB = getSortName(b.artist)
      if (nameA < nameB) return -1
      if (nameA > nameB) return 1
      return 0
    })

    return result
  }, [initialArtists, myVotedArtists, filterUnvoted])

  // ページネーション計算
  const totalPages = Math.ceil(filteredArtists.length / ITEMS_PER_PAGE)
  const currentArtists = filteredArtists.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const handleFilterChange = (checked: boolean) => {
    setFilterUnvoted(checked)
    setCurrentPage(1)
  }

  // ページネーション部品
  const renderPagination = () => {
    if (totalPages <= 1) return null
    return (
      <div style={{ margin: '20px 0', display: 'flex', flexWrap: 'wrap', gap: '5px', justifyContent: 'center' }}>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <button
            key={page}
            onClick={() => {
              setCurrentPage(page)
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
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
        ))}
      </div>
    )
  }

  return (
    <div>
      {/* コントロールエリア */}
      <div style={{ marginBottom: '10px', padding: '15px', background: '#f9f9f9', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <input
          type="checkbox"
          id="filterUnvoted"
          checked={filterUnvoted}
          onChange={(e) => handleFilterChange(e.target.checked)}
          style={{ transform: 'scale(1.2)', cursor: 'pointer' }}
        />
        <label htmlFor="filterUnvoted" style={{ cursor: 'pointer', fontWeight: 'bold' }}>
          未登録のみ表示
        </label>
        <span style={{ marginLeft: 'auto', fontSize: '0.9em', color: '#666' }}>
          {filteredArtists.length} 組
        </span>
      </div>

      {renderPagination()}

      <ul style={{ listStyle: 'none', padding: 0 }}>
        {currentArtists.map((item, index) => {
          // 全体の中での順位を計算
          const rank = (currentPage - 1) * ITEMS_PER_PAGE + index + 1
          
          return (
            <li key={item.artist} style={{ borderBottom: '1px solid #eee', padding: '15px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                
                {/* 順位バッジ */}
                <span style={{ 
                  fontSize: '1.2em', fontWeight: 'bold', color: '#888', 
                  minWidth: '30px', textAlign: 'center' 
                }}>
                  {rank}
                </span>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Link href={`/songs/${encodeURIComponent(item.artist)}`} style={{ fontWeight: 'bold', fontSize: '1.2em', textDecoration: 'none', color: '#0070f3' }}>
                      {item.artist}
                    </Link>
                    {myVotedArtists.includes(item.artist) && (
                      <span style={{ fontSize: '0.8em', background: '#e0ffe0', color: '#008000', padding: '2px 6px', borderRadius: '4px' }}>
                        済
                      </span>
                    )}
                  </div>
                  {/* 代表曲表示 */}
                  <div style={{ fontSize: '0.9em', color: '#555', marginTop: '4px' }}>
                    代表曲: <span style={{fontWeight:'bold'}}>{item.top_song || '(なし)'}</span>
                  </div>
                </div>
              </div>

              {/* 右側：スコアと票数（ここが新しいデザイン！） */}
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.1em', fontWeight: 'bold' }}>
                  {item.total_score.toFixed(2)} <span style={{fontSize:'0.7em', fontWeight:'normal'}}>pt</span>
                </div>
                <div style={{ fontSize: '0.8em', color: '#888' }}>
                  ({item.vote_count}票)
                </div>
              </div>
            </li>
          )
        })}
      </ul>

      {renderPagination()}
    </div>
  )
}