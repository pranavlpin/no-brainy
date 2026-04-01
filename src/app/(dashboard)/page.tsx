// This file intentionally left as a re-export to avoid route conflicts
// The root page.tsx handles the redirect to /notes
// Middleware handles auth redirect to /login for unauthenticated users
export { default } from '../page'
