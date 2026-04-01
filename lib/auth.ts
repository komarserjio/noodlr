export const AUTH_COOKIE = 'auth-token'
export const USER_ID_HEADER = 'x-user-id'

// Hash password with PBKDF2 — returns "saltHex:hashHex"
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const saltHex = Array.from(salt)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  )
  const hashBuffer = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100_000, hash: 'SHA-256' },
    keyMaterial,
    256
  )
  const hashHex = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  return `${saltHex}:${hashHex}`
}

// Verify a plaintext password against a stored hash
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltHex, storedHash] = stored.split(':')
  if (!saltHex || !storedHash) return false

  const salt = new Uint8Array(saltHex.match(/.{2}/g)!.map((b) => parseInt(b, 16)))
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  )
  const hashBuffer = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100_000, hash: 'SHA-256' },
    keyMaterial,
    256
  )
  const hashHex = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  return hashHex === storedHash
}

// Create a session token: "userId.hmac(userId)"
export async function createSessionToken(userId: number): Promise<string> {
  const secret = process.env.AUTH_SECRET ?? 'default-secret'
  const payload = String(userId)

  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(payload))
  const sigHex = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  return `${payload}.${sigHex}`
}

// Verify a session token — returns userId or null
export async function verifySessionToken(token: string): Promise<number | null> {
  const dotIndex = token.indexOf('.')
  if (dotIndex === -1) return null

  const payload = token.slice(0, dotIndex)
  const sigHex = token.slice(dotIndex + 1)
  if (!payload || !sigHex) return null

  const secret = process.env.AUTH_SECRET ?? 'default-secret'
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const expectedSig = await crypto.subtle.sign('HMAC', key, encoder.encode(payload))
  const expectedHex = Array.from(new Uint8Array(expectedSig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  if (expectedHex !== sigHex) return null

  const userId = parseInt(payload)
  return isNaN(userId) ? null : userId
}
