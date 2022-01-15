import { test, expect as pwExpect } from '@playwright/test'
import { expect } from 'chai'

import { checkElementExists, RUNDB, showWebPageErrorsInTerminal } from '../../test-utils'

test.describe('Login Page', () => {
  test.beforeEach(async ({ page, context }) => {
    showWebPageErrorsInTerminal(page)
    await context.clearCookies()
    await page.goto('/login')
  })

  test('Not logged in redirects to login page', async ({ page }) => {
    await page.goto('/')
    const pageURL1 = new URL(page.url())

    expect(pageURL1.pathname).to.equal('/login')

    await page.goto('/sub-management')
    const pageURL2 = new URL(page.url())

    expect(pageURL2.pathname).to.equal('/login')

    await page.goto('/settings')
    const pageURL3 = new URL(page.url())

    expect(pageURL3.pathname).to.equal('/login')
  })

  test('validates login page html and text', async ({ page }) => {
    await pwExpect(page).toHaveTitle('Roffline - Login')

    await pwExpect(page.locator('form').last()).toContainText(
      `Roffline doesn't use passwords, but rather unique usernames.`
    )
    await pwExpect(page.locator('form').last()).toContainText(
      `Copy the username below & save it. Then click the signup button.`
    )

    await checkElementExists(page.locator('h1:has-text("Roffline Login")'))

    await checkElementExists(page.locator('a:has-text("Login")'))
    await checkElementExists(page.locator('a:has-text("Sign Up")'))
    await checkElementExists(page.locator('button:has-text("Login")'))
    await checkElementExists(page.locator('button:has-text("Sign Up")'))

    await checkElementExists(page.locator('.login-form input[name="csrfToken"]').first())

    const loginFormCsrfInput = await page.getAttribute('.login-form input[name="csrfToken"]', 'value')

    expect(loginFormCsrfInput).to.have.lengthOf.above(5)

    await checkElementExists(page.locator('.signup-form input[name="csrfToken"]').last())

    const signupFormCsrfInput = await page.getAttribute('.signup-form input[name="csrfToken"]', 'value')

    expect(signupFormCsrfInput).to.have.lengthOf.above(5)

    await checkElementExists(page.locator('.login-form input[type="text"]'))

    const loginFormInputVal = await page.getAttribute('.login-form input[type="text"]', 'placeholder')

    expect(loginFormInputVal).to.equal('Username')

    await checkElementExists(page.locator('.signup-form input[type="text"]'))

    const pre = await page.textContent('pre')

    expect(pre?.trim()).to.have.lengthOf.above(5)

    await checkElementExists(page.locator('.copy-to-clipboard-button'))
  })

  // Cant really do this test as would need https in order to read the clipboard with the clipboard api
  // it('should copy new username to clipboard when click on button to do so', function () {})

  test('should show different tab when you click on another tab', async ({ page }) => {
    const visLoginForm1 = await page.isVisible('.login-form')
    const visSignupForm1 = await page.isVisible('.signup-form')

    expect(visLoginForm1).to.be.true
    expect(visSignupForm1).to.be.false

    await pwExpect(page.locator('.signup-form')).toHaveClass('is-hidden signup-form')
    await pwExpect(page.locator('.login-form')).toHaveClass('login-form')

    await page.click('a:has-text("Sign Up")')

    const visLoginForm2 = await page.isVisible('.login-form')
    const visSignupForm2 = await page.isVisible('.signup-form')

    expect(visLoginForm2).to.be.false
    expect(visSignupForm2).to.be.true

    await pwExpect(page.locator('.login-form')).toHaveClass('is-hidden login-form')
    await pwExpect(page.locator('.signup-form')).toHaveClass('signup-form')

    await page.click('a:has-text("Login")')

    const visLoginForm3 = await page.isVisible('.login-form')
    const visSignupForm3 = await page.isVisible('.signup-form')

    expect(visLoginForm3).to.be.true
    expect(visSignupForm3).to.be.false

    await pwExpect(page.locator('.signup-form')).toHaveClass('is-hidden signup-form')
    await pwExpect(page.locator('.login-form')).toHaveClass('login-form')
  })

  test('should generate a different username on each page load', async ({ page }) => {
    const firstGeneratedUsername = await page.textContent('pre')

    await page.goto('/login')

    const secondGeneratedUsername = await page.textContent('pre')

    expect(secondGeneratedUsername?.trim()).to.not.equal(firstGeneratedUsername?.trim())
  })

  test('should login with new or existing user when click on login button', async ({ page, context }) => {
    const cookies1 = await context.cookies()

    expect(cookies1).to.be.empty

    await page.click('a:has-text("Sign Up")')

    const newUserUsername = (await page.textContent('pre'))?.trim() as string

    await page.click('button:has-text("Sign Up")')

    const pageURL1 = new URL(page.url())

    expect(pageURL1.pathname).to.equal('/')

    const cookies2 = await context.cookies()

    expect(cookies2[0]).to.include({ name: 'loggedInUser', httpOnly: true, secure: false, sameSite: 'Strict' })
    expect(cookies2[0].value).to.have.lengthOf.above(5)
    expect(cookies2[0].value).to.equal(newUserUsername)

    await context.clearCookies()

    await page.goto('/login')

    const cookies3 = await context.cookies()

    expect(cookies3).to.be.empty

    await page.fill('input[placeholder="Username"]', newUserUsername)

    await page.click('button:has-text("Login")')

    const pageURL2 = new URL(page.url())

    expect(pageURL2.pathname).to.equal('/')

    const cookies4 = await context.cookies()

    expect(cookies4[0]).to.include({ name: 'loggedInUser', httpOnly: true, secure: false, sameSite: 'Strict' })
    expect(cookies4[0].value).to.have.lengthOf.above(5)
    expect(cookies4[0].value).to.equal(newUserUsername)

    // Remove user we just created
    await RUNDB('DELETE FROM users WHERE name = ?', newUserUsername)
  })

  test('should login with new or existing user when press enter', async ({ page, context }) => {
    const cookies1 = await context.cookies()

    expect(cookies1).to.be.empty

    await page.click('a:has-text("Sign Up")')

    const newUserUsername = (await page.textContent('pre'))?.trim() as string

    await page.press('button:has-text("Sign Up")', 'Enter')

    const pageURL1 = new URL(page.url())

    expect(pageURL1.pathname).to.equal('/')

    const cookies2 = await context.cookies()

    expect(cookies2[0]).to.include({ name: 'loggedInUser', httpOnly: true, secure: false, sameSite: 'Strict' })
    expect(cookies2[0].value).to.have.lengthOf.above(5)
    expect(cookies2[0].value).to.equal(newUserUsername)

    await context.clearCookies()

    await page.goto('/login')

    const cookies3 = await context.cookies()

    expect(cookies3).to.be.empty

    await page.fill('input[placeholder="Username"]', newUserUsername)

    await page.press('button:has-text("Login")', 'Enter')

    const pageURL2 = new URL(page.url())

    expect(pageURL2.pathname).to.equal('/')

    const cookies4 = await context.cookies()

    expect(cookies4[0]).to.include({ name: 'loggedInUser', httpOnly: true, secure: false, sameSite: 'Strict' })
    expect(cookies4[0].value).to.have.lengthOf.above(5)
    expect(cookies4[0].value).to.equal(newUserUsername)

    // Remove user we just created
    await RUNDB('DELETE FROM users WHERE name = ?', newUserUsername)
  })

  test('should send the correct form data on submit', async ({ page, context }) => {
    const newUserUsername = (await page.textContent('pre'))?.trim() as string

    const csrfToken1 = (await page.getAttribute('input[name="csrfToken"]', 'value'))?.trim() as string

    await page.route('/api/create-user', route => {
      const postJSON = route.request().postDataJSON() as { signupUsername: string; csrfToken: string }

      expect(postJSON).to.have.all.keys('signupUsername', 'csrfToken')
      expect(postJSON).to.have.property('signupUsername', newUserUsername)
      expect(postJSON).to.have.property('csrfToken', csrfToken1)

      route.continue()
    })

    await page.click('a:has-text("Sign Up")')

    await page.click('button:has-text("Sign Up")')

    await page.unroute('/api/create-user')

    await context.clearCookies()

    await page.goto('/login')

    await page.fill('input[placeholder="Username"]', newUserUsername)

    const csrfToken2 = (await page.getAttribute('input[name="csrfToken"]', 'value'))?.trim() as string

    await page.route('/api/create-user', route => {
      const postJSON = route.request().postDataJSON() as { signupUsername: string; csrfToken: string }

      expect(postJSON).to.have.all.keys('signupUsername', 'csrfToken')
      expect(postJSON).to.have.property('signupUsername', newUserUsername)
      expect(postJSON).to.have.property('csrfToken', csrfToken2)

      route.continue()
    })

    await page.press('button:has-text("Login")', 'Enter')

    // Remove user we just created
    await RUNDB('DELETE FROM users WHERE name = ?', newUserUsername)
  })

  test('should show an error message if user not found when trying to log in', async ({ page }) => {
    await page.fill('input[placeholder="Username"]', 'asd')

    await page.click('button:has-text("Login")')

    await checkElementExists(page.locator('span:has-text("Error logging in. User ")'))

    const code = (await page.textContent('code'))?.trim() as string

    expect(code.trim()).to.equal('asd')

    await checkElementExists(page.locator('span:has-text(" not found")'))
  })

  test('should not have a cookie after visited logged out route', async ({ page, context }) => {
    await page.click('a:has-text("Sign Up")')

    const newUserUsername = (await page.textContent('pre'))?.trim() as string

    await page.click('button:has-text("Sign Up")')

    const cookies1 = await context.cookies()

    expect(cookies1[0]).to.include({ name: 'loggedInUser', httpOnly: true, secure: false, sameSite: 'Strict' })
    expect(cookies1[0].value).to.have.lengthOf.above(5)
    expect(cookies1[0].value).to.equal(newUserUsername)

    await page.goto('/logout')

    await page.goto('/')

    const cookies2 = await context.cookies()

    expect(cookies2).to.be.empty

    // Remove user we just created
    await RUNDB('DELETE FROM users WHERE name = ?', newUserUsername)
  })
})
