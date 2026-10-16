import { render } from '@testing-library/react'
import { it, expect } from 'vitest'
import { InsightCard } from '@/components/insights/insight-card'
it('renders provider text without interpreting raw HTML', () => {
  const { container } = render(
    <InsightCard
      id="one"
      insightType="time"
      contentMd={'An observation <img src="bad" onerror="alert(1)">'}
      severity="info"
      generatedAt="2026-10-12"
      onDismiss={() => {}}
    />
  )
  expect(container.querySelector('img')).toBeNull()
})
