const encoder = new TextEncoder()

export const COOKIE_NAME = 'carshare_session'
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // 30 days in seconds

type SessionPayload = { iat: number }

async function getKey(): Promise<CryptoKey> {
  const secret = process.env.SESSION_SECRET
  if (!secret) {
    throw new Error('SESSION_SECRET environment variable is not set')
  }
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  )
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(value: string): Uint8Array<ArrayBuffer> {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/')
  const binary = atob(base64)
  const bytes = new Uint8Array(new ArrayBuffer(binary.length))
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

export async function signSession(payload: SessionPayload): Promise<string> {
  const key = await getKey()
  const payloadBytes = encoder.encode(JSON.stringify(payload))
  const encodedPayload = toBase64Url(payloadBytes)
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(encodedPayload))
  const encodedSig = toBase64Url(new Uint8Array(signature))
  return `${encodedPayload}.${encodedSig}`
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  const parts = token.split('.')
  if (parts.length !== 2) return null
  const [encodedPayload, encodedSig] = parts
  if (!encodedPayload || !encodedSig) return null

  try {
    const key = await getKey()
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      fromBase64Url(encodedSig),
      encoder.encode(encodedPayload)
    )
    if (!valid) return null

    const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(encodedPayload)))
    if (typeof payload?.iat !== 'number') return null
    // iat is ms (Date.now()), COOKIE_MAX_AGE is seconds. Reject replayed tokens
    // past the 30-day window even if the HMAC is still valid.
    if (Date.now() - payload.iat > COOKIE_MAX_AGE * 1000) return null
    return payload as SessionPayload
  } catch {
    return null
  }
}

export function verifyAccessCode(candidate: string): boolean {
  const expected = process.env.ACCESS_CODE
  if (!expected || !candidate) return false

  const a = encoder.encode(candidate)
  const b = encoder.encode(expected)

  // No early-exit on byte mismatch, and the length difference is folded into the
  // accumulator. Note: the loop bound varies with the candidate's length, so this
  // is not fully constant-time across inputs of differing length — it guards byte
  // values, not length. Acceptable here: the secret length is not itself sensitive.
  let diff = a.length ^ b.length
  const max = Math.max(a.length, b.length)
  for (let i = 0; i < max; i++) {
    diff |= (a[i] ?? 0) ^ (b[i] ?? 0)
  }
  return diff === 0
}
