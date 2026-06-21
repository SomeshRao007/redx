type Env = {
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
  JWT_SECRET: string
}

export const onRequestGet: PagesFunction<Env> = ({ request, env }) => {
  const origin = new URL(request.url).origin
  const state = crypto.randomUUID()

  const auth = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  auth.search = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: `${origin}/auth/google/callback`,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'online',
    state,
    prompt: 'select_account',
  }).toString()

  const headers = new Headers({ Location: auth.toString() })
  // Short-lived (5 min) CSRF token, readable only by the callback over TLS.
  headers.append(
    'Set-Cookie',
    `oauth_state=${state}; Max-Age=300; Path=/auth/google; HttpOnly; Secure; SameSite=Lax`,
  )
  return new Response(null, { status: 302, headers })
}
