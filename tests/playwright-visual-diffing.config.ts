import { devices } from '@playwright/test'
import type { PlaywrightTestConfig } from '@playwright/test'

const config: PlaywrightTestConfig = {
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  testDir: 'visual-diffing',
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
    /*****
      Some slowMo is needed cause of the text on the page. I dunno why this happens, but
      the text needs an extra moment to be rendered right or something. I think its the font
      kerning or something. Perhaps its the particular fonts i'm using. If I dont add a small
      delay, the text is slightly different and the visual diff tests dont pass.
    *****/
    launchOptions: {
      slowMo: 200,
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Galaxy S8',
      use: { ...devices['Galaxy S8'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
    // {
    //   name: 'iPad (gen 7)',
    //   use: { ...devices['iPad (gen 7)'] },
    // },
    // {
    //   name: 'iPhone 7',
    //   use: { ...devices['iPhone 7'] },
    // },
  ],
}
export default config
