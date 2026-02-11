'use client'

import { useState, useMemo } from 'react'
import { upsertVote, deleteVote, toggleVoteFlag } from '@/app/actions'
import Link from 'next/link'
import { MAX_PASSIONATE_LIMIT } from '@/utils/constants'

type Vote = {
  id: number
  artist: string
  song: string
  comment: string | null
  is_passionate: boolean
}

type FilterState = 'all' | 'true' | 'false'

const ITEMS_PER_PAGE = 50

export default function Dashboard({ initialVotes }: { initialVotes: Vote[] }) {
  const [artist, setArtist] = useState('')
  const [song, setSong] = useState('')
  const [comment, setComment] = useState('')
  const [isPassionate, setIsPassionate] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const [currentPage, setCurrentPage] = useState(1)
  const [filterPassion, setFilterPassion] = useState<FilterState>('all')

  const getSortName = (name: string) => {
    const lowerName = name.toLowerCase()
    if (lowerName.startsWith('the ')) {
      return lowerName.slice(4) + ', the'
    }
    return lowerName
  }

  // 熱量ONの件数を計算（表示用）
  const passionateCount = initialVotes.filter(v => v.is_passionate).length

  const processedVotes = useMemo(() => {
    let result = [...initialVotes]

    if (filterPassion === 'true') {
      result = result.filter(v => v.is_passionate)
    } else if (filterPassion === 'false') {
      result = result.filter(v => !v.is_passionate)
    }

    result.sort((a, b) => {
      const nameA = getSortName(a.artist)
      const nameB = getSortName(b.artist)
      if (nameA < nameB) return -1
      if (nameA > nameB) return 1
      return 0
    })

    return result
  }, [initialVotes, filterPassion])

  const totalPages = Math.ceil(processedVotes.length / ITEMS_PER_PAGE)
  const currentVotes = processedVotes.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const toggleFilter = (current: FilterState, setter: (s: FilterState) => void) => {
    setCurrentPage(1)
    if (current === 'all') setter('true')
    else if (current === 'true') setter('false')
    else setter('all')
  }

  async function onSubmitHandler(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault() 
    if (isLoading) return 
    setIsLoading(true)
    try {
      const formData = new FormData(e.currentTarget)
      formData.set('is_passionate', isPassionate.toString())
      
      const result = await upsertVote(formData, false)

      if (result?.status === 'confirm_needed') {
        if (confirm(result.message)) {
          const result2 = await upsertVote(formData, true)
          // confirm後の2回目の呼び出し結果もハンドリング
          if (result2?.status === 'error') {
            alert(result2.message)
          } else {
            alert('書き換えました！')
            resetForm()
          }
        }
      } else if (result?.status === 'success') {
        alert('保存しました！')
        resetForm()
      } else if (result?.status === 'error') {
        alert(result.message) // エラーメッセージをそのまま表示（上限エラーなど）
      }
    } catch (err) {
      console.error(err)
      alert('予期せぬエラーが発生しました。')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDelete() {
    if (!artist) return alert('アーティスト名が入力されていません')
    if (confirm(`本当に「${artist}」のデータを削除してもいいですか？`)) {
      setIsLoading(true)
      await deleteVote(artist)
      alert('削除しました')
      resetForm()
      setIsLoading(false)
    }
  }

  async function handleToggle(voteId: number, currentValue: boolean) {
    const result = await toggleVoteFlag(voteId, 'is_passionate', !currentValue)
    if (result.status === 'error') {
        alert(result.message) // 上限エラーなどを表示
    }
  }

  function resetForm() {
    setArtist('')
    setSong('')
    setComment('')
    setIsPassionate(false)
  }

  const renderPagination = () => {
    if (totalPages <= 1) return null
    return (
      <div style={{ margin: '20px 0', display: 'flex', flexWrap: 'wrap', gap: '5px', justifyContent: 'center' }}>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
          const startIdx = (page - 1) * ITEMS_PER_PAGE
          const endIdx = Math.min(page * ITEMS_PER_PAGE, processedVotes.length) - 1
          const startData = processedVotes[startIdx]
          const endData = processedVotes[endIdx]
          const startChar = startData ? getSortName(startData.artist).charAt(0).toUpperCase() : '?'
          const endChar = endData ? getSortName(endData.artist).charAt(0).toUpperCase() : '?'

          return (
            <button
              key={page}
              onClick={() => {
                setCurrentPage(page)
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              title={`${startChar} ... ${endChar}`} 
              style={{
                padding: '6px 10px',
                border: '1px solid #ccc',
                background: currentPage === page ? 'black' : 'white',
                color: currentPage === page ? 'white' : 'black',
                cursor: 'pointer',
                borderRadius: '4px',
                fontSize: '12px'
              }}
            >
              {page}
            </button>
          )
        })}
      </div>
    )
  }

  const getFilterButtonStyle = (state: FilterState) => ({
    padding: '5px 10px',
    cursor: 'pointer',
    background: state === 'all' ? '#f0f0f0' : (state === 'true' ? '#e0ffe0' : '#ffe0e0'),
    border: '1px solid #ccc',
    borderRadius: '4px',
    minWidth: '40px',
    fontWeight: 'bold' as const
  })

  const inputStyle = {
    padding: '10px',
    fontSize: '16px',
    width: '100%',
    boxSizing: 'border-box' as const,
    background: '#fff',
    border: '1px solid #ddd',
    borderRadius: '6px'
  }

  return (
    <div>
      <div style={{ background: '#f9f9f9', padding: '20px', borderRadius: '8px', marginBottom: '30px' }}>
        <form onSubmit={onSubmitHandler} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          
          <div>
            <label style={{fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '5px'}}>アーティスト名</label>
            <input 
              name="artist" 
              value={artist} 
              onChange={(e) => setArtist(e.target.value)} 
              placeholder="例: The Beatles" 
              required 
              maxLength={100} 
              style={inputStyle} 
            />
          </div>

          <div>
            <label style={{fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '5px'}}>曲名</label>
            <input 
              name="song" 
              value={song} 
              onChange={(e) => setSong(e.target.value)} 
              placeholder="例: Across the Universe" 
              required 
              maxLength={100} 
              style={inputStyle} 
            />
          </div>

          <div style={{ background: '#fff', padding: '15px', borderRadius: '6px', border: '1px solid #ddd' }}>
             <label style={{ display: 'flex', gap: '10px', cursor: 'pointer', alignItems: 'center' }}>
              <input 
                type="checkbox" 
                checked={isPassionate} 
                onChange={(e) => setIsPassionate(e.target.checked)} 
                style={{ transform: 'scale(1.2)' }} 
              />
              <span style={{ fontSize: '14px', fontWeight: isPassionate ? 'bold' : 'normal' }}>
                熱量あり（ハート）をつける
                <span style={{ fontSize: '0.8em', color: '#666', marginLeft: '10px' }}>
                  ※ 現在 {passionateCount} / {MAX_PASSIONATE_LIMIT}
                </span>
              </span>
            </label>
            <p style={{ margin: '5px 0 0 24px', fontSize: '12px', color: '#666' }}>
               特に思い入れの強い曲にチェックを入れてください。上限は{MAX_PASSIONATE_LIMIT}曲です。
            </p>
          </div>

          <div>
            <label style={{fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '5px'}}>コメント</label>
            <textarea 
              name="comment" 
              value={comment} 
              onChange={(e) => setComment(e.target.value)} 
              placeholder="推薦コメント（140文字まで）" 
              maxLength={140} 
              style={{ ...inputStyle, height: '80px' }} 
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button type="submit" disabled={isLoading} style={{ flex: 2, padding: '12px', background: isLoading ? '#999' : 'black', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold', borderRadius: '4px' }}>{isLoading ? '通信中...' : '箱舟に乗せる（保存）'}</button>
            <button type="button" onClick={handleDelete} disabled={!artist || isLoading} style={{ flex: 1, padding: '12px', background: (!artist || isLoading) ? '#ccc' : '#d32f2f', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '4px' }}>降ろす</button>
          </div>
        </form>
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <h2>あなたの登録リスト（全{initialVotes.length}曲）</h2>
        
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', background: '#f0f0f0', padding: '5px 10px', borderRadius: '20px' }}>
          <span style={{ fontSize: '12px', fontWeight: 'bold' }}>絞り込み:</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ fontSize: '12px' }}>熱量</span>
            <button 
              onClick={() => toggleFilter(filterPassion, setFilterPassion)}
              style={getFilterButtonStyle(filterPassion)}
            >
              {filterPassion === 'all' ? 'ー' : (filterPassion === 'true' ? '❤️' : '✖')}
            </button>
          </div>
        </div>
      </div>

      {renderPagination()}

      <ul style={{ listStyle: 'none', padding: 0 }}>
        {currentVotes.map((vote) => (
          <li key={vote.id} style={{ borderBottom: '1px solid #ddd', padding: '10px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
              <Link 
                href={`/songs/${encodeURIComponent(vote.artist)}`}
                style={{ fontWeight: 'bold', fontSize: '1.1em', whiteSpace: 'nowrap', color: 'black', textDecoration: 'underline' }}
              >
                {vote.artist}
              </Link>
              <span style={{ color: '#888' }}>/</span>
              <span style={{ fontSize: '1.1em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {vote.song}
              </span>
              
              <button
                type="button"
                onClick={() => handleToggle(vote.id, vote.is_passionate)}
                title={vote.is_passionate ? "熱量あり（クリックで解除）" : "クリックで熱量ON"}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2em', opacity: vote.is_passionate ? 1 : 0.2, marginLeft: '10px' }}
              >
                {vote.is_passionate ? '❤️' : '♡'}
              </button>
            </div>

            <button 
              onClick={() => {
                setArtist(vote.artist)
                setSong(vote.song)
                setComment(vote.comment || '')
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
      
      {renderPagination()}
    </div>
  )
}