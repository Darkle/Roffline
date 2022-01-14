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
      slowMo: 300,
    },
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
    {
      name: 'Desktop Firefox',
      use: {
        ...devices['Desktop Firefox'],
        viewport: {
          width: 1280,
          // cause the settings page is taller than the default height
          height: 1480,
        },
      },
    },
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
