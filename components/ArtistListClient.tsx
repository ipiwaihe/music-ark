'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'

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

  // ■ The抜きソート用のヘルパー関数
  // "The Beatles" -> "beatles, the"
  const getSortName = (name: string) => {
    const lowerName = name.toLowerCase()
    if (lowerName.startsWith('the ')) return lowerName.slice(4) + ', the'
    return lowerName
  }

  // ■ フィルタリング & ソートロジック
  const filteredArtists = useMemo(() => {
    let result = [...initialArtists]

    // (A) 未登録フィルター
    if (filterUnvoted) {
      result = result.filter(item => !myVotedArtists.includes(item.artist))
    }
    
    // (B) ★変更: The抜き名前順でソート
    result.sort((a, b) => {
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

  // ■ ページネーション部品
  const renderPagination = () => {
    if (totalPages <= 1) return null
    
    return (
      <div style={{ margin: '20px 0', display: 'flex', flexWrap: 'wrap', gap: '5px', justifyContent: 'center' }}>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
          // ★復活: そのページの先頭と末尾の頭文字を取得
          const startIdx = (page - 1) * ITEMS_PER_PAGE
          const endIdx = Math.min(page * ITEMS_PER_PAGE, filteredArtists.length) - 1
          
          const startData = filteredArtists[startIdx]
          const endData = filteredArtists[endIdx]

          // ソート用名称の1文字目を取得して大文字にする (例: "beatles..." -> "B")
          const startChar = startData ? getSortName(startData.artist).charAt(0).toUpperCase() : '?'
          const endChar = endData ? getSortName(endData.artist).charAt(0).toUpperCase() : '?'
          
          return (
            <button
              key={page}
              onClick={() => {
                setCurrentPage(page)
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              // ★ここに頭文字情報をセット
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
        {currentArtists.map((item) => {
          // ★変更: 順位バッジは消す（名前順リストなので順位は意味を持たないため）
          // 代わりにシンプルにリスト表示する
          
          return (
            <li key={item.artist} style={{ borderBottom: '1px solid #eee', padding: '15px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                
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

              {/* 右側：スコアと票数（情報は残しておく） */}
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