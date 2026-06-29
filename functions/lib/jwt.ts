import { SignJWT } from 'jose'

// One place to mint the app JWT — used by Google callback, dev-login, register, login.
export type AppClaims = { sub: string; email?: string; name?: string; picture?: string }

export function mintAppJwt(claims: AppClaims, secret: string): Promise<string> {
  return new SignJWT(claims)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(new TextEncoder().encode(secret))
}
