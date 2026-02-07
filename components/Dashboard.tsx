'use client'

import { useState, useMemo } from 'react'
import { upsertVote, deleteVote, toggleVoteFlag } from '@/app/actions'
import Link from 'next/link'

type Vote = {
  id: number
  artist: string
  song: string
  comment: string | null
  is_knowledgeable: boolean 
  is_passionate: boolean
}

// フィルターの状態定義（全表示 / Trueのみ / Falseのみ）
type FilterState = 'all' | 'true' | 'false'

const ITEMS_PER_PAGE = 50

export default function Dashboard({ initialVotes }: { initialVotes: Vote[] }) {
  // --- フォーム用のState ---
  const [artist, setArtist] = useState('')
  const [song, setSong] = useState('')
  const [comment, setComment] = useState('')
  const [isKnowledgeable, setIsKnowledgeable] = useState(false)
  const [isPassionate, setIsPassionate] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // --- リスト表示用のState ---
  const [currentPage, setCurrentPage] = useState(1)
  const [filterKnowledge, setFilterKnowledge] = useState<FilterState>('all')
  const [filterPassion, setFilterPassion] = useState<FilterState>('all')

  // ■ ヘルパー関数: The抜きソート用
  const getSortName = (name: string) => {
    const lowerName = name.toLowerCase()
    if (lowerName.startsWith('the ')) {
      return lowerName.slice(4) + ', the'
    }
    return lowerName
  }

  // ■ フィルタリング & ソート処理 (useMemoで高速化)
  const processedVotes = useMemo(() => {
    let result = [...initialVotes]

    // 1. 知識フィルター
    if (filterKnowledge === 'true') {
      result = result.filter(v => v.is_knowledgeable)
    } else if (filterKnowledge === 'false') {
      result = result.filter(v => !v.is_knowledgeable)
    }

    // 2. 熱量フィルター
    if (filterPassion === 'true') {
      result = result.filter(v => v.is_passionate)
    } else if (filterPassion === 'false') {
      result = result.filter(v => !v.is_passionate)
    }

    // 3. ソート（The抜きアルファベット順）
    result.sort((a, b) => {
      const nameA = getSortName(a.artist)
      const nameB = getSortName(b.artist)
      if (nameA < nameB) return -1
      if (nameA > nameB) return 1
      return 0
    })

    return result
  }, [initialVotes, filterKnowledge, filterPassion])

  // ■ ページネーション計算
  const totalPages = Math.ceil(processedVotes.length / ITEMS_PER_PAGE)
  const currentVotes = processedVotes.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  // フィルター切り替え関数
  const toggleFilter = (current: FilterState, setter: (s: FilterState) => void) => {
    setCurrentPage(1) // フィルターを変えたら1ページ目に戻す
    if (current === 'all') setter('true')
    else if (current === 'true') setter('false')
    else setter('all')
  }

  // --- 既存のアクション関数 ---
  async function onSubmitHandler(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault() 
    if (isLoading) return 
    setIsLoading(true)
    try {
      const formData = new FormData(e.currentTarget)
      formData.set('is_knowledgeable', isKnowledgeable.toString())
      formData.set('is_passionate', isPassionate.toString())
      const result = await upsertVote(formData, false)

      if (result?.status === 'confirm_needed') {
        if (confirm(result.message)) {
          await upsertVote(formData, true)
          alert('書き換えました！')
          resetForm()
        }
      } else if (result?.status === 'success') {
        alert('保存しました！')
        resetForm()
      } else if (result?.status === 'error') {
        alert('エラー: ' + result.message)
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

  async function handleToggle(voteId: number, field: 'is_knowledgeable' | 'is_passionate', currentValue: boolean) {
    const result = await toggleVoteFlag(voteId, field, !currentValue)
    if (result.status === 'error') alert('更新できませんでした')
  }

  function resetForm() {
    setArtist('')
    setSong('')
    setComment('')
    setIsKnowledgeable(false)
    setIsPassionate(false)
  }

  // ■ ページネーション部品
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
                window.scrollTo({ top: 0, behavior: 'smooth' }) // リスト上部へスクロールさせるなら微調整必要かも
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

  // ■ フィルターボタンの見た目用ヘルパー
  const getFilterButtonContent = (state: FilterState, trueIcon: string, falseIcon: string) => {
    if (state === 'all') return 'ー' // 全表示
    if (state === 'true') return trueIcon // Trueのみ
    return falseIcon // Falseのみ
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

  return (
    <div>
      {/* 入力フォームエリア */}
      <div style={{ background: '#f9f9f9', padding: '20px', borderRadius: '8px', marginBottom: '30px' }}>
        <form onSubmit={onSubmitHandler} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {/* ... (フォームの中身は変更なし) ... */}
          <div>
            <label style={{fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '5px'}}>アーティスト名</label>
            <input name="artist" value={artist} onChange={(e) => setArtist(e.target.value)} placeholder="例: The Beatles" required maxLength={100} style={{ padding: '10px', fontSize: '16px', width: '100%', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '5px'}}>曲名</label>
            <input name="song" value={song} onChange={(e) => setSong(e.target.value)} placeholder="例: Across the Universe" required maxLength={100} style={{ padding: '10px', fontSize: '16px', width: '100%', boxSizing: 'border-box' }} />
          </div>
          <div style={{ background: '#fff', padding: '15px', borderRadius: '6px', border: '1px solid #ddd', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <label style={{ display: 'flex', gap: '10px', cursor: 'pointer', alignItems: 'flex-start' }}>
              <input type="checkbox" checked={isKnowledgeable} onChange={(e) => setIsKnowledgeable(e.target.checked)} style={{ transform: 'scale(1.2)', marginTop: '3px' }} />
              <span style={{ fontSize: '14px', color: isKnowledgeable ? 'black' : '#888', fontWeight: isKnowledgeable ? 'bold' : 'normal' }}>
                {isKnowledgeable ? "このアーティストについて、ファンである・ある程度曲を知っている。" : "このアーティストについて、あまり詳しくない（あまり曲を知らない）。"}
              </span>
            </label>
            <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: 0 }} />
            <label style={{ display: 'flex', gap: '10px', cursor: 'pointer', alignItems: 'flex-start' }}>
              <input type="checkbox" checked={isPassionate} onChange={(e) => setIsPassionate(e.target.checked)} style={{ transform: 'scale(1.2)', marginTop: '3px' }} />
              <span style={{ fontSize: '14px', color: isPassionate ? 'black' : '#888', fontWeight: isPassionate ? 'bold' : 'normal' }}>
                {isPassionate ? "この曲は、結構こだわりのお気に入り曲。" : "1曲選ぶならこれだけど、そこまでこだわりは無いかも。"}
              </span>
            </label>
          </div>
          <div>
            <label style={{fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '5px'}}>コメント</label>
            <textarea name="comment" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="推薦コメント（140文字まで）" maxLength={140} style={{ padding: '10px', fontSize: '16px', height: '80px', width: '100%', boxSizing: 'border-box' }} />
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button type="submit" disabled={isLoading} style={{ flex: 2, padding: '12px', background: isLoading ? '#999' : 'black', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold', borderRadius: '4px' }}>{isLoading ? '通信中...' : '箱舟に乗せる（保存）'}</button>
            <button type="button" onClick={handleDelete} disabled={!artist || isLoading} style={{ flex: 1, padding: '12px', background: (!artist || isLoading) ? '#ccc' : '#d32f2f', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '4px' }}>降ろす</button>
          </div>
        </form>
      </div>
      
      {/* --- リスト表示エリア --- */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <h2>あなたの登録リスト（全{initialVotes.length}曲 / 表示{processedVotes.length}曲）</h2>
        
        {/* ▼▼▼ フィルター操作エリア ▼▼▼ */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', background: '#f0f0f0', padding: '5px 10px', borderRadius: '20px' }}>
          <span style={{ fontSize: '12px', fontWeight: 'bold' }}>絞り込み:</span>
          
          {/* 知識フィルターボタン */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ fontSize: '12px' }}>知識</span>
            <button 
              onClick={() => toggleFilter(filterKnowledge, setFilterKnowledge)}
              style={getFilterButtonStyle(filterKnowledge)}
            >
              {getFilterButtonContent(filterKnowledge, '🎓', '✖')}
            </button>
          </div>

          {/* 熱量フィルターボタン */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ fontSize: '12px' }}>熱量</span>
            <button 
              onClick={() => toggleFilter(filterPassion, setFilterPassion)}
              style={getFilterButtonStyle(filterPassion)}
            >
              {getFilterButtonContent(filterPassion, '❤️', '✖')}
            </button>
          </div>
        </div>
        {/* ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲ */}
      </div>

      {/* ページネーション（上） */}
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
              
              {/* アイコン（クリックでトグル） */}
              <div style={{ display: 'flex', gap: '4px', marginLeft: '10px' }}>
                <button
                  type="button"
                  onClick={() => handleToggle(vote.id, 'is_knowledgeable', vote.is_knowledgeable)}
                  title={vote.is_knowledgeable ? "知識あり" : "詳しくない"}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2em', opacity: vote.is_knowledgeable ? 1 : 0.3 }}
                >
                  {vote.is_knowledgeable ? '🎓' : '✖'}
                </button>
                <button
                  type="button"
                  onClick={() => handleToggle(vote.id, 'is_passionate', vote.is_passionate)}
                  title={vote.is_passionate ? "熱量あり" : "こだわり薄"}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2em', opacity: vote.is_passionate ? 1 : 0.3 }}
                >
                  {vote.is_passionate ? '❤️' : '✖'}
                </button>
              </div>
            </div>

            <button 
              onClick={() => {
                setArtist(vote.artist)
                setSong(vote.song)
                setComment(vote.comment || '')
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
      
      {/* ページネーション（下） */}
      {renderPagination()}
    </div>
  )
}