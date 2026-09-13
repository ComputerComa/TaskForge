declare module '#auth-utils' {
  interface User {
    id: number
    username: string
    name: string
  }

  interface UserSession {
    user: User
    // Set instead of `user` while a login is mid-2FA-challenge -- a
    // session shaped like this has no `user` key, so it correctly fails
    // every existing requireAuth/requireUserSession call (they only
    // check for `.user`). See server/api/auth/login.post.ts and
    // server/api/auth/totp/verify.post.ts.
    pending?: {
      userId: number
      methods: ('totp' | 'webauthn')[]
      createdAt: number
    }
    // Scratch storage for one in-flight WebAuthn ceremony's challenge --
    // see server/api/webauthn/{register,authenticate}.post.ts. Cleared
    // (or overwritten) once that ceremony completes either way.
    webauthnChallenge?: {
      attemptId: string
      challenge: string
      createdAt: number
    }
  }
}

export {}
