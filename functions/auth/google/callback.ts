import { SignJWT, decodeJwt } from 'jose'

type Env = {
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
  JWT_SECRET: string
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url)
  const origin = url.origin

  const cookieState = (request.headers.get('Cookie') ?? '')
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith('oauth_state='))
    ?.slice('oauth_state='.length)
  const queryState = url.searchParams.get('state')

  // CSRF: state must be present and match the cookie set at /login.
  if (!cookieState || !queryState || cookieState !== queryState) {
    return new Response('Invalid request', { status: 400 })
  }

  const clear =
    'oauth_state=; Max-Age=0; Path=/auth/google; HttpOnly; Secure; SameSite=Lax'

  const fail = () => {
    const headers = new Headers({ Location: `${origin}/?auth_error=1` })
    headers.append('Set-Cookie', clear)
    return new Response(null, { status: 302, headers })
  }

  const code = url.searchParams.get('code')
  if (!code) return fail()

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: `${origin}/auth/google/callback`,
      grant_type: 'authorization_code',
    }).toString(),
  })
  if (!tokenRes.ok) return fail()

  const { id_token } = (await tokenRes.json()) as { id_token?: string }
  if (!id_token) return fail()

  // id_token came straight from Google over TLS; decode (no re-verify needed).
  const claims = decodeJwt(id_token)
  if (typeof claims.sub !== 'string') return fail()

  const appJwt = await new SignJWT({
    sub: claims.sub,
    name: claims.name,
    email: claims.email,
    picture: claims.picture,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(new TextEncoder().encode(env.JWT_SECRET))

  const headers = new Headers({ Location: `${origin}/?token=${appJwt}` })
  headers.append('Set-Cookie', clear)
  return new Response(null, { status: 302, headers })
}
