import { devices } from '@playwright/test'
import type { PlaywrightTestConfig } from '@playwright/test'

const config: PlaywrightTestConfig = {
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  testDir: 'e2e',
  testIgnore: 'playwright-global-setup.ts',
  workers: 1,
  snapshotDir: 'snapshots',
  globalSetup: 'playwright-global-setup.ts',
  maxFailures: 1, // exit on first failed test
  use: {
    baseURL: 'http://0.0.0.0:8080',
    headless: true,
    trace: 'retain-on-failure',
    screenshot: 'off',
    video: 'off',
    // launchOptions: {
    //   slowMo: 1500,
    // },
    acceptDownloads: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],
}
export default config