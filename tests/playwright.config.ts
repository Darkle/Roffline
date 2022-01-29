import { devices } from '@playwright/test'
import type { PlaywrightTestConfig } from '@playwright/test'

const config: PlaywrightTestConfig = {
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
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
      use: {
        //Some of the tests require video to be played, so need to use chrome instead of chromium for the codecs
        channel: 'chrome',
        ...devices['Desktop Chrome'],
      },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    /*****
      I was unable to get webkit to work on debian.
    *****/
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],
}
export default config
