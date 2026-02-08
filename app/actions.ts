'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

// ■ 曲を登録または更新する機能
export async function upsertVote(formData: FormData, forceUpdate = false) {
  const supabase = await createClient()

  // 1. ログインチェック
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { status: 'error', message: 'ログインが必要です' }
  }

  // 2. フォームデータの取得と整形
  const artist = (formData.get('artist') as string)?.trim()
  const song = (formData.get('song') as string)?.trim()
  const comment = (formData.get('comment') as string)?.trim() || null
  
  // チェックボックスは "true" という文字列か、存在しないかで判定されることが多いが、
  // クライアント側で明示的に "true"/"false" 文字列を送っている場合は以下でOK
  const isKnowledgeable = formData.get('is_knowledgeable') === 'true'
  const isPassionate = formData.get('is_passionate') === 'true'

  if (!artist || !song) {
    return { status: 'error', message: 'アーティスト名と曲名は必須です' }
  }

  // 3. 既存データのチェック（上書き確認用）
  if (!forceUpdate) {
    const { data: existingVote } = await supabase
      .from('votes')
      .select('song, id') // idも取っておく
      .eq('user_id', user.id)
      .eq('artist', artist)
      .single()

    // 既に登録済みで、かつ曲名が違う場合（＝曲の変更）は確認を出す
    if (existingVote && existingVote.song !== song) {
      return {
        status: 'confirm_needed',
        message: `すでに「${existingVote.song}」を登録しています。\n「${song}」に書き換えますか？`
      }
    }
  }

  // 4. 保存実行 (Upsert)
  const { error } = await supabase
    .from('votes')
    .upsert({
      user_id: user.id,
      artist: artist,
      song: song,
      comment: comment,
      is_knowledgeable: isKnowledgeable,
      is_passionate: isPassionate,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id, artist' // 複合ユニーク制約を指定
    })

  if (error) {
    console.error('Upsert Error:', error)
    return { status: 'error', message: '保存に失敗しました' }
  }

  // 関連するページを再生成（自分のリスト、ランキング、詳細など）
  revalidatePath('/', 'layout') 
  return { status: 'success', message: '保存しました' }
}

// ■ 曲を削除する機能
export async function deleteVote(artist: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase
      .from('votes')
      .delete()
      .eq('user_id', user.id)
      .eq('artist', artist)

    revalidatePath('/', 'layout')
}

// ■ フラグ単体を切り替える機能（ダッシュボード用）
export async function toggleVoteFlag(voteId: number, field: 'is_knowledgeable' | 'is_passionate', newValue: boolean) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { status: 'error', message: 'ログインが必要です' }

  const { error } = await supabase
    .from('votes')
    .update({ 
      [field]: newValue, 
      updated_at: new Date().toISOString()
    })
    .eq('id', voteId)
    .eq('user_id', user.id)

  if (error) {
    console.error(error)
    return { status: 'error', message: '更新失敗' }
  }

  revalidatePath('/', 'layout')
  return { status: 'success' }
}