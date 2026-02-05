'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers' // 追加

// ■ 曲を登録または更新する機能
export async function upsertVote(
  formData: FormData, 
  forceUpdate: boolean = false // 上書き許可フラグ
) {
  const supabase = await createClient()
  
  // ログインチェック
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { message: 'ログインしてください' }

  const artist = formData.get('artist') as string
  const song = formData.get('song') as string
  const comment = formData.get('comment') as string

  // 1. まず、同じアーティストが登録済みかチェック
  const { data: existing } = await supabase
    .from('votes')
    .select('id')
    .eq('user_id', user.id)
    .eq('artist', artist)
    .single()

  // 2. 既に存在していて、かつ「上書き許可」がない場合
  if (existing && !forceUpdate) {
    // フロントエンドに「確認してね」と合図を送る
    return { status: 'confirm_needed', message: '既に登録されています。上書きしますか？' }
  }

  // 3. 登録または更新（Upsert）
  // unique制約 (user_id, artist) があるので、onConflictを指定すると
  // 「あれば更新、なければ新規登録」を自動でやってくれます
  const { error } = await supabase
    .from('votes')
    .upsert({
      id: existing?.id, // IDがあれば指定（更新）、なければundefined（新規）
      user_id: user.id,
      artist,
      song,
      comment,
      updated_at: new Date().toISOString(), // 更新日時
    }, { onConflict: 'user_id, artist' })

  if (error) {
    return { status: 'error', message: 'エラーが発生しました' }
  }

  revalidatePath('/')
  return { status: 'success', message: '保存しました！' }
}

// ■ 曲を削除する機能
export async function deleteVote(artistName: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('votes')
    .delete()
    .eq('user_id', user.id)
    .eq('artist', artistName)

  revalidatePath('/')
}

// ■ フィルター設定を切り替える機能
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

  revalidatePath('/')
}