import { login, signup } from './actions'
import Link from 'next/link'

export default function LoginPage() {
  return (
    <div style={{ maxWidth: '400px', margin: '100px auto', textAlign: 'center', fontFamily: 'sans-serif' }}>
      <h1>ログイン / 新規登録</h1>
      <p>メールアドレスとパスワードを入力してください</p>
      
      <form style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '30px' }}>
        <input 
          id="email" 
          name="email" 
          type="email" 
          placeholder="メールアドレス" 
          required
          style={{ padding: '12px', fontSize: '16px' }}
        />
        <input 
          id="password" 
          name="password" 
          type="password" 
          placeholder="パスワード（6文字以上）" 
          required
          style={{ padding: '12px', fontSize: '16px' }}
        />
        
        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          {/* formActionを使って、ボタンごとに違う関数（ログイン/登録）を呼ぶ */}
          <button formAction={login} style={{ flex: 1, padding: '12px', background: 'black', color: 'white', border: 'none', cursor: 'pointer' }}>
            ログイン
          </button>
          <button formAction={signup} style={{ flex: 1, padding: '12px', background: 'white', color: 'black', border: '1px solid black', cursor: 'pointer' }}>
            新規登録
          </button>
        </div>
      </form>
      {/* ▼▼▼ 追加: みんなのリストへのリンク ▼▼▼ */}
      <div style={{ marginTop: '30px', textAlign: 'center' }}>
        <p style={{ marginBottom: '10px', fontSize: '0.9em', color: '#666' }}>
          どんな曲が登録されているか見てみる？
        </p>
        <Link
          href="/songs" 
          style={{ 
            display: 'inline-block', 
            padding: '10px 20px', 
            border: '1px solid #ccc', 
            borderRadius: '4px', 
            textDecoration: 'none', 
            color: 'black',
            background: 'white',
            fontWeight: 'bold'
          }}
        >
          みんなのリストを見る
        </Link>
      </div>
    </div>
  )
}