'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { MAX_PASSIONATE_LIMIT } from '@/utils/constants'

// ■ ヘルパー：熱量フラグの上限チェック
// 現在の登録数と、これから登録しようとしている内容を比較してエラーかどうか判定する
async function checkPassionateLimit(supabase: any, userId: string, isNewPassionate: boolean, excludeVoteId?: number) {
  if (!isNewPassionate) return { ok: true } // 熱量OFFならチェック不要

  // 自分の熱量ONのデータをカウント（更新時は自分自身を除外してカウント）
  let query = supabase
    .from('votes')
    .select('*', { count: 'exact', head: true }) // head:trueでデータ本体は取らず数だけ取る
    .eq('user_id', userId)
    .eq('is_passionate', true)

  if (excludeVoteId) {
    query = query.neq('id', excludeVoteId)
  }

  const { count, error } = await query

  if (error) {
    console.error(error)
    return { ok: false, message: 'データ確認中にエラーが発生しました' }
  }

  if (count >= MAX_PASSIONATE_LIMIT) {
    return { 
      ok: false, 
      message: `「熱量あり（ハート）」にできるのは${MAX_PASSIONATE_LIMIT}曲までです。\nどれかのハートを外してから登録してください。` 
    }
  }

  return { ok: true }
}


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
  
  // is_knowledgeable は廃止
  const isPassionate = formData.get('is_passionate') === 'true'

  if (!artist || !song) {
    return { status: 'error', message: 'アーティスト名と曲名は必須です' }
  }

  // 1. 既存データの確認（ID取得と上書きチェックのため）
  const { data: existingVote } = await supabase
    .from('votes')
    .select('id, song, is_passionate')
    .eq('user_id', user.id)
    .eq('artist', artist)
    .single()

  // 2. 上書き確認
  if (!forceUpdate && existingVote && existingVote.song !== song) {
    return {
      status: 'confirm_needed',
      message: `すでに「${existingVote.song}」を登録しています。\n「${song}」に書き換えますか？`
    }
  }

  // 3. 熱量上限チェック
  // 既存データがあるならそのIDを除外してカウント（更新でTrueのまま維持する場合などを考慮）
  const check = await checkPassionateLimit(supabase, user.id, isPassionate, existingVote?.id)
  if (!check.ok) {
    return { status: 'error', message: check.message }
  }

  // 4. 保存実行
  const { error } = await supabase
    .from('votes')
    .upsert({
      id: existingVote?.id, // IDがあれば更新になる
      user_id: user.id,
      artist: artist,
      song: song,
      comment: comment,
      is_passionate: isPassionate,
      // is_knowledgeable は削除
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
// field引数は後方互換で残すが、実質 is_passionate しか使わない
export async function toggleVoteFlag(voteId: number, field: 'is_knowledgeable' | 'is_passionate', newValue: boolean) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { status: 'error', message: 'ログインが必要です' }

  // 熱量をONにする場合のみ上限チェック
  if (field === 'is_passionate' && newValue === true) {
    const check = await checkPassionateLimit(supabase, user.id, true, voteId)
    if (!check.ok) {
      return { status: 'error', message: check.message }
    }
  }

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

// ■ フィルター設定を切り替える機能
export async function toggleFilterMode() {
  const { cookies } = await import('next/headers')
  const cookieStore = await cookies()
  const currentMode = cookieStore.get('filter_mode')?.value

  if (currentMode === 'all') {
    cookieStore.delete('filter_mode') 
  } else {
    cookieStore.set('filter_mode', 'all')
  }

  revalidatePath('/', 'layout')
}