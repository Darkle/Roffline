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
  },
  projects: [
    {
      name: 'Desktop Chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: {
          width: 1280,
          // cause the settings page is taller than the default height
          // https://github.com/microsoft/playwright/blob/main/packages/playwright-core/src/server/deviceDescriptorsSource.json
          height: 1480,
        },
      },
    },
    {
      name: 'Galaxy S8',
      use: {
        ...devices['Galaxy S8'],
        viewport: {
          width: 360,
          // cause the settings page is taller than the default height
          height: 1480,
        },
      },
    },
    /*****
     The visual tests are exceptionaly flaky with firefox - keep getting the following
     error: `browser.newContext: Target page, context or browser has been closed`.
     So gonna leave them out for now.
    *****/
    // {
    //   name: 'Desktop Firefox',
    //   use: {
    //     ...devices['Desktop Firefox'],
    //     viewport: {
    //       width: 1280,
    //       // cause the settings page is taller than the default height
    //       height: 1480,
    //     },
    //   },
    // },
    // {
    //   name: 'Desktop Safari (webkit)',
    //   use: {
    //     ...devices['Desktop Safari'],
    //     viewport: {
    //       width: 1280,
    //       // cause the settings page is taller than the default height
    //       height: 1480,
    //     },
    //   },
    // },
    // {
    //   name: 'iPad (gen 7)',
    //   use: { ...devices['iPad (gen 7)'] },
    // },
    // {
    //   name: 'iPhone 7',
    //   use: {
    //     ...devices['iPhone 7'],
    //     viewport: {
    //       width: 375,
    //       height: 1480,
    //     },
    //   },
    // },
  ],
}
export default config
