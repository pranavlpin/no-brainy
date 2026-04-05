import { NextResponse } from 'next/server'
import OpenAI from 'openai'

/**
 * Catches OpenAI SDK errors and returns appropriate HTTP responses.
 * Use in catch blocks of AI route handlers.
 */
export function handleAIError(error: unknown): NextResponse {
  if (error instanceof OpenAI.AuthenticationError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'AI_AUTH_ERROR',
          message: 'Your OpenAI API key is invalid or expired. Please update it in Settings.',
        },
      },
      { status: 401 }
    )
  }

  if (error instanceof OpenAI.RateLimitError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'AI_RATE_LIMITED',
          message: 'OpenAI rate limit reached. Please wait a moment and try again.',
        },
      },
      { status: 429 }
    )
  }

  if (error instanceof OpenAI.BadRequestError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'AI_BAD_REQUEST',
          message: 'The content could not be processed. It may be too long or contain unsupported content.',
        },
      },
      { status: 400 }
    )
  }

  if (error instanceof SyntaxError) {
    // JSON parse failure from AI response
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'AI_PARSE_ERROR',
          message: 'Failed to parse AI response. Please try again.',
        },
      },
      { status: 502 }
    )
  }

  // Generic fallback
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'AI_ERROR',
        message: 'An error occurred while processing your AI request.',
      },
    },
    { status: 500 }
  )
}
