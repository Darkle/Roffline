import { test } from '@playwright/test'
import { expect } from 'chai'
import { StatusCodes as HttpStatusCode } from 'http-status-codes'

import { createTestUser, deleteTestUser } from '../../test-utils'

test.beforeAll(async () => {
  await createTestUser()
})

test('Check cant access admin pages without login', async ({ page }) => {
  page.on('response', response => {
    expect(response.status()).to.equal(HttpStatusCode.UNAUTHORIZED)
  })

  await page.goto('/admin/', { waitUntil: 'networkidle' })
  await page.goto('/admin/settings', { waitUntil: 'networkidle' })
  await page.goto('/admin/users', { waitUntil: 'networkidle' })
  await page.goto('/admin/logs-viewer', { waitUntil: 'networkidle' })
  await page.goto('/admin/db-viewer', { waitUntil: 'networkidle' })
  await page.goto('/admin/downloads-viewer', { waitUntil: 'networkidle' })
})

test.afterAll(async () => {
  await deleteTestUser()
})
