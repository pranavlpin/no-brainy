import { it, expect } from 'vitest'
import OpenAI from 'openai'
import { handleAIError } from '@/lib/ai/error-handler'
it('makes timeout and invalid-key failures actionable without echoing provider details', async () => {
  const timeout = handleAIError(
    new OpenAI.APIConnectionTimeoutError({ message: 'private provider payload' })
  )
  expect(timeout.status).toBe(504)
  expect(await timeout.text()).not.toContain('private provider payload')
  const invalid = handleAIError(
    new OpenAI.AuthenticationError(401, { message: 'private key' }, 'private key', new Headers())
  )
  expect(invalid.status).toBe(401)
  expect(await invalid.text()).not.toContain('private key')
})
