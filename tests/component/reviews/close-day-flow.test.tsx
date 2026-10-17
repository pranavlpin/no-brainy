import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { CloseDayFlow } from '@/components/reviews/close-day-flow'

const stats = { tasksCompleted: 3, tasksMissed: 1, notesCreated: 2, cardsReviewed: 10 }

describe('CloseDayFlow', () => {
  it('walks stats → reflect → mood → tomorrow and requires mood and intent to finish', async () => {
    const onFinish = vi.fn()
    render(<CloseDayFlow stats={stats} onFinish={onFinish} />)

    // Steps hand off with an exit animation, so wait for each one to mount.
    expect(screen.getByTestId('close-day-step-stats')).toBeInTheDocument()
    await userEvent.click(screen.getByTestId('close-day-next'))
    expect(await screen.findByTestId('close-day-step-reflect')).toBeInTheDocument()
    await userEvent.type(await screen.findByTestId('reflect-wentWell'), 'Shipped the planner')
    await userEvent.click(screen.getByTestId('close-day-next'))
    expect(await screen.findByTestId('close-day-step-mood')).toBeInTheDocument()
    await userEvent.click(await screen.findByTestId('mood-good'))
    await userEvent.click(screen.getByTestId('close-day-next'))
    expect(await screen.findByTestId('close-day-step-tomorrow')).toBeInTheDocument()

    expect(screen.getByTestId('close-day-finish')).toBeDisabled()
    await userEvent.type(await screen.findByTestId('tomorrow-intent-input'), 'Build the Home page')
    expect(screen.getByTestId('close-day-finish')).toBeEnabled()
    await userEvent.click(screen.getByTestId('close-day-finish'))

    expect(onFinish).toHaveBeenCalledTimes(1)
    const payload = onFinish.mock.calls[0][0]
    expect(payload.mood).toBe('good')
    expect(payload.tomorrowIntent).toBe('Build the Home page')
    expect(payload.reflectionMd).toContain('Shipped the planner')
  })

  it('starts from existing values and can go back', async () => {
    render(
      <CloseDayFlow
        stats={stats}
        initial={{
          reflectionMd: '## What went well\n\nOld text',
          mood: 'okay',
          tomorrowIntent: 'Rest',
        }}
        onFinish={vi.fn()}
      />
    )
    await userEvent.click(screen.getByTestId('close-day-next'))
    expect(await screen.findByTestId('reflect-wentWell')).toHaveValue('Old text')
    await userEvent.click(screen.getByTestId('close-day-back'))
    expect(await screen.findByTestId('close-day-step-stats')).toBeInTheDocument()
  })
})
