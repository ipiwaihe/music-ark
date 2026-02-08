'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'

// ■ 曲を登録または更新する機能
export async function upsertVote(formData: FormData, forceUpdate = false) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { status: 'error', message: 'ログインが必要です' }
  }

  const artist = (formData.get('artist') as string)?.trim()
  const song = (formData.get('song') as string)?.trim()
  const comment = (formData.get('comment') as string)?.trim() || null
  
  const isKnowledgeable = formData.get('is_knowledgeable') === 'true'
  const isPassionate = formData.get('is_passionate') === 'true'

  if (!artist || !song) {
    return { status: 'error', message: 'アーティスト名と曲名は必須です' }
  }

  // 既存データのチェック
  if (!forceUpdate) {
    const { data: existingVote } = await supabase
      .from('votes')
      .select('song, id')
      .eq('user_id', user.id)
      .eq('artist', artist)
      .single()

    if (existingVote && existingVote.song !== song) {
      return {
        status: 'confirm_needed',
        message: `すでに「${existingVote.song}」を登録しています。\n「${song}」に書き換えますか？`
      }
    }
  }

  // 保存実行
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
      onConflict: 'user_id, artist'
    })

  if (error) {
    console.error('Upsert Error:', error)
    return { status: 'error', message: '保存に失敗しました' }
  }

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

// ▼▼▼ 復活！: フィルター設定を切り替える機能 ▼▼▼
export async function toggleFilterMode() {
  const cookieStore = await cookies()
  const currentMode = cookieStore.get('filter_mode')?.value

  // ロジック反転：
  // 今が 'all' なら、削除してデフォルト（ユーザのみ）に戻す
  // 今が デフォルト（ユーザのみ）なら、'all' をセットして全表示にする
  if (currentMode === 'all') {
    cookieStore.delete('filter_mode') 
  } else {
    cookieStore.set('filter_mode', 'all')
  }

  revalidatePath('/', 'layout')
}