import { SignJWT } from 'jose'

// Dev-only: mints a REAL HS256 app JWT for the stub user so local sync uses the same
// verification path as production. Gated on AUTH_STUB=1 (set only in .dev.vars); returns
// 404 in prod where that var is unset, so there is no auth-bypass branch in /sync itself.
type Env = { JWT_SECRET: string; AUTH_STUB?: string }

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  if (env.AUTH_STUB !== '1') return new Response('Not found', { status: 404 })
  const origin = new URL(request.url).origin
  const token = await new SignJWT({ sub: 'stub-user', name: 'Local Dev', email: 'dev@local' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(new TextEncoder().encode(env.JWT_SECRET))
  return new Response(null, { status: 302, headers: { Location: `${origin}/?token=${token}` } })
}
