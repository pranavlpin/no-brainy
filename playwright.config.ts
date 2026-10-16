import { defineConfig, devices } from '@playwright/test'

if (process.env.NOBRAINY_TEST_RUN !== '1') {
  throw new Error('Run browser tests through npm run test:e2e to isolate the database')
}

export default defineConfig({
  testDir: './test/e2e',
  outputDir: './evidences/browser/results',
  reporter: 'list',
  workers: 1,
  timeout: 60000,
  expect: { timeout: 15000 },
  use: {
    baseURL: 'http://127.0.0.1:3100',
    screenshot: 'off',
    trace: 'off',
    video: 'off',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'node_modules/.bin/next dev --hostname 127.0.0.1 --port 3100',
    url: 'http://127.0.0.1:3100/login',
    reuseExistingServer: false,
    timeout: 120000,
  },
})
