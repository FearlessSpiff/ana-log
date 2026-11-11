import PocketBase from 'pocketbase'

// The app is served by PocketBase itself (or proxied by Vite in dev), so the
// API lives on the same origin.
export const pb = new PocketBase('/')
pb.autoCancellation(false)

export function signIn() {
  return pb.collection('users').authWithOAuth2({ provider: 'google' })
}
