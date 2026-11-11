import { useState } from 'react'
import { pb, signIn } from '../pb'

// Only usable against a PocketBase started with DEV_MODE=1 (see dev.sh).
const devSignIn = () => pb.collection('users').authWithPassword('dev@ana-log.local', 'devpassword')

export function Login() {
  const [error, setError] = useState('')

  const attempt = (login: () => Promise<unknown>) => async () => {
    setError('')
    try {
      await login()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }
  const onClick = attempt(signIn)

  return (
    <div className="login">
      <h1>ana-log</h1>
      <p className="muted">A notebook for your film cameras.</p>
      <button className="primary big" onClick={onClick}>
        Sign in with Google
      </button>
      {import.meta.env.DEV && <button onClick={attempt(devSignIn)}>Dev login (test user)</button>}
      {error && <p className="error">{error}</p>}
    </div>
  )
}
