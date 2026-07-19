import { useEffect, useState } from 'react'
import { supabase } from './supabase'

function Auth({
  initialMode = 'login',
  onPasswordUpdated,
}) {
  const [mode, setMode] =
    useState(initialMode)

  const [email, setEmail] =
    useState('')

  const [password, setPassword] =
    useState('')

  const [newPassword, setNewPassword] =
    useState('')

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState('')

  const [
    showPassword,
    setShowPassword,
  ] = useState(false)

  const [loading, setLoading] =
    useState(false)

  const [message, setMessage] =
    useState('')

  const [
    errorMessage,
    setErrorMessage,
  ] = useState('')

  useEffect(() => {
    setMode(initialMode)
  }, [initialMode])

  useEffect(() => {
    const authListener =
      supabase.auth.onAuthStateChange(
        (event) => {
          if (
            event === 'PASSWORD_RECOVERY'
          ) {
            setMode('update-password')

            setMessage(
              'Introduce una nueva contraseña para completar la recuperación.'
            )

            setErrorMessage('')
          }
        }
      )

    const currentUrl = new URL(
      window.location.href
    )

    const hashParameters =
      new URLSearchParams(
        currentUrl.hash.replace('#', '')
      )

    const recoveryType =
      currentUrl.searchParams.get('type') ||
      hashParameters.get('type')

    if (recoveryType === 'recovery') {
      setMode('update-password')

      setMessage(
        'Introduce una nueva contraseña para completar la recuperación.'
      )

      setErrorMessage('')
    }

    return () => {
      authListener.data.subscription.unsubscribe()
    }
  }, [])

  function clearMessages() {
    setMessage('')
    setErrorMessage('')
  }

  function openLogin() {
    setMode('login')
    setPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setShowPassword(false)
    clearMessages()
  }

  function openRecovery() {
    setMode('recovery')
    setPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setShowPassword(false)
    clearMessages()
  }

  async function handleLogin(event) {
    event.preventDefault()

    if (loading) {
      return
    }

    const normalizedEmail =
      email.trim().toLowerCase()

    if (
      !normalizedEmail ||
      !password
    ) {
      setErrorMessage(
        'Introduce el correo y la contraseña.'
      )

      return
    }

    setLoading(true)
    clearMessages()

    const result =
      await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      })

    if (result.error) {
      console.error(
        'Error al iniciar sesión:',
        result.error
      )

      setErrorMessage(
        'El correo o la contraseña no son correctos.'
      )
    }

    setLoading(false)
  }

  async function handleRecovery(event) {
    event.preventDefault()

    if (loading) {
      return
    }

    const normalizedEmail =
      email.trim().toLowerCase()

    if (!normalizedEmail) {
      setErrorMessage(
        'Introduce tu correo electrónico.'
      )

      return
    }

    setLoading(true)
    clearMessages()

    const redirectUrl =
      window.location.origin +
      '/?type=recovery'

    const result =
      await supabase.auth.resetPasswordForEmail(
        normalizedEmail,
        {
          redirectTo: redirectUrl,
        }
      )

    if (result.error) {
      console.error(
        'Error al enviar la recuperación:',
        result.error
      )

      setErrorMessage(
        'No se pudo enviar el correo de recuperación. Inténtalo de nuevo.'
      )
    } else {
      setMessage(
        'Te hemos enviado un correo. Abre el enlace para crear o cambiar tu contraseña.'
      )
    }

    setLoading(false)
  }

  async function handleUpdatePassword(
    event
  ) {
    event.preventDefault()

    if (loading) {
      return
    }

    if (newPassword.length < 8) {
      setErrorMessage(
        'La contraseña debe tener al menos 8 caracteres.'
      )

      return
    }

    if (
      newPassword !== confirmPassword
    ) {
      setErrorMessage(
        'Las dos contraseñas no coinciden.'
      )

      return
    }

    setLoading(true)
    clearMessages()

    const sessionResult =
      await supabase.auth.getSession()

    if (
      sessionResult.error ||
      !sessionResult.data.session
    ) {
      console.error(
        'No existe sesión de recuperación:',
        sessionResult.error
      )

      setErrorMessage(
        'El enlace de recuperación ha caducado o ya se ha utilizado. Solicita uno nuevo.'
      )

      setLoading(false)
      return
    }

    const result =
      await supabase.auth.updateUser({
        password: newPassword,
      })

    if (result.error) {
      console.error(
        'Error al actualizar la contraseña:',
        result.error
      )

      setErrorMessage(
        'No se pudo establecer la contraseña: ' +
          result.error.message
      )

      setLoading(false)
      return
    }

    setNewPassword('')
    setConfirmPassword('')
    setShowPassword(false)

    await supabase.auth.signOut()

    window.history.replaceState(
      {},
      document.title,
      window.location.origin
    )

    setMode('login')

    setMessage(
      'Contraseña guardada. Ya puedes entrar con tu correo y contraseña.'
    )

    setLoading(false)

    if (onPasswordUpdated) {
      onPasswordUpdated()
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <span className="auth-flag">
          🇯🇵
        </span>

        <p className="eyebrow">
          MI VIAJE
        </p>

        <h1>Japón 2026</h1>

        {mode === 'login' && (
          <>
            <p className="auth-description">
              Accede con tu correo y contraseña
              para consultar y editar el viaje.
            </p>

            <form
              className="auth-form"
              onSubmit={handleLogin}
            >
              <label>
                Correo electrónico

                <input
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(
                      event.target.value
                    )
                  }
                  placeholder="tu-correo@ejemplo.com"
                  autoComplete="email"
                  inputMode="email"
                  required
                />
              </label>

              <label>
                Contraseña

                <div className="auth-password-field">
                  <input
                    type={
                      showPassword
                        ? 'text'
                        : 'password'
                    }
                    value={password}
                    onChange={(event) =>
                      setPassword(
                        event.target.value
                      )
                    }
                    placeholder="Tu contraseña"
                    autoComplete="current-password"
                    required
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        (currentValue) =>
                          !currentValue
                      )
                    }
                    aria-label={
                      showPassword
                        ? 'Ocultar contraseña'
                        : 'Mostrar contraseña'
                    }
                  >
                    {showPassword
                      ? 'Ocultar'
                      : 'Mostrar'}
                  </button>
                </div>
              </label>

              <button
                className="auth-button"
                type="submit"
                disabled={loading}
              >
                {loading
                  ? 'Entrando...'
                  : 'Entrar'}
              </button>
            </form>

            <button
              className="auth-secondary-button"
              type="button"
              onClick={openRecovery}
              disabled={loading}
            >
              Crear o recuperar contraseña
            </button>
          </>
        )}

        {mode === 'recovery' && (
          <>
            <p className="auth-description">
              Recibirás un enlace para crear o
              cambiar la contraseña de tu usuario
              actual.
            </p>

            <form
              className="auth-form"
              onSubmit={handleRecovery}
            >
              <label>
                Correo electrónico

                <input
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(
                      event.target.value
                    )
                  }
                  placeholder="tu-correo@ejemplo.com"
                  autoComplete="email"
                  inputMode="email"
                  required
                />
              </label>

              <button
                className="auth-button"
                type="submit"
                disabled={loading}
              >
                {loading
                  ? 'Enviando...'
                  : 'Enviar correo de recuperación'}
              </button>
            </form>

            <button
              className="auth-secondary-button"
              type="button"
              onClick={openLogin}
              disabled={loading}
            >
              ← Volver a iniciar sesión
            </button>
          </>
        )}

        {mode === 'update-password' && (
          <>
            <p className="auth-description">
              Crea una contraseña segura para
              acceder directamente desde la PWA y
              desde el ordenador.
            </p>

            <form
              className="auth-form"
              onSubmit={
                handleUpdatePassword
              }
            >
              <label>
                Nueva contraseña

                <div className="auth-password-field">
                  <input
                    type={
                      showPassword
                        ? 'text'
                        : 'password'
                    }
                    value={newPassword}
                    onChange={(event) =>
                      setNewPassword(
                        event.target.value
                      )
                    }
                    placeholder="Mínimo 8 caracteres"
                    autoComplete="new-password"
                    minLength="8"
                    required
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        (currentValue) =>
                          !currentValue
                      )
                    }
                    aria-label={
                      showPassword
                        ? 'Ocultar contraseña'
                        : 'Mostrar contraseña'
                    }
                  >
                    {showPassword
                      ? 'Ocultar'
                      : 'Mostrar'}
                  </button>
                </div>
              </label>

              <label>
                Repetir contraseña

                <input
                  type={
                    showPassword
                      ? 'text'
                      : 'password'
                  }
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(
                      event.target.value
                    )
                  }
                  placeholder="Repite la contraseña"
                  autoComplete="new-password"
                  minLength="8"
                  required
                />
              </label>

              <button
                className="auth-button"
                type="submit"
                disabled={loading}
              >
                {loading
                  ? 'Guardando...'
                  : 'Guardar contraseña'}
              </button>
            </form>
          </>
        )}

        {message && (
          <div className="auth-message success">
            <strong>
              {mode === 'recovery'
                ? 'Correo enviado'
                : 'Información'}
            </strong>

            <p>{message}</p>
          </div>
        )}

        {errorMessage && (
          <div className="auth-message error">
            <strong>
              Ha ocurrido un problema
            </strong>

            <p>{errorMessage}</p>
          </div>
        )}

        <p className="auth-help">
          El acceso está limitado a usuarios
          existentes. No se pueden crear cuentas
          nuevas desde Japan26.
        </p>
      </section>
    </main>
  )
}

export default Auth