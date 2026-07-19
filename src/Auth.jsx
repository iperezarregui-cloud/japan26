import { useState } from 'react'
import { supabase } from './supabase'

function Auth() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  async function handleLogin(event) {
    event.preventDefault()

    setLoading(true)
    setMessage('')
    setErrorMessage('')

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    })

    if (error) {
      setErrorMessage(
        'No se pudo enviar el enlace. Comprueba el correo e inténtalo de nuevo.'
      )
    } else {
      setMessage(
        'Te hemos enviado un enlace de acceso. Revisa tu correo.'
      )
      setEmail('')
    }

    setLoading(false)
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <span className="auth-flag">🇯🇵</span>

        <p className="eyebrow">MI VIAJE</p>
        <h1>Japón 2026</h1>

        <p className="auth-description">
          Accede para consultar y editar el viaje desde cualquier
          dispositivo.
        </p>

        <form className="auth-form" onSubmit={handleLogin}>
          <label>
            Correo electrónico

            <input
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="tu-correo@ejemplo.com"
              autoComplete="email"
              required
            />
          </label>

          <button
            className="auth-button"
            type="submit"
            disabled={loading}
          >
            {loading
              ? 'Enviando enlace...'
              : 'Recibir enlace de acceso'}
          </button>
        </form>

        {message && (
          <div className="auth-message success">
            <strong>Correo enviado</strong>
            <p>{message}</p>
          </div>
        )}

        {errorMessage && (
          <div className="auth-message error">
            <strong>Ha ocurrido un problema</strong>
            <p>{errorMessage}</p>
          </div>
        )}

        <p className="auth-help">
          No necesitas contraseña. Recibirás un enlace seguro
          para entrar en la aplicación.
        </p>
      </section>
    </main>
  )
}

export default Auth