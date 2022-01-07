/// <reference types="cypress" />

describe('Login Page', function () {
  before(function () {
    cy.logout()
  })

  it('Not logged in redirects to login page', function () {
    // cy.task('log', Cypress.env().TESTING_DEFAULT_USER)
    cy.visit('/')
    cy.location('pathname').should('eq', '/login')
  })

  it('validates login page look and html', function () {
    cy.get('form').contains(`Roffline doesn't use passwords, but rather unique usernames.`)
    cy.get('form').contains(`Copy the username below & save it. Then click the signup button.`)

    cy.title().should('eq', 'Roffline - Login')
  })

  // it('should copy new username to clipboard when click on button to do so', function () {})

  // it('should show different tab when you click on another tab', function () {})

  // it('should generate a random username', function () {
  //   //https://docs.cypress.io/guides/core-concepts/introduction-to-cypress#Avoid-loops
  // })

  // it('should login with new or existing user when click on login button', function () {
  //   //remove the new user after its logged in
  //   //TODO: check it created a cookie with the user name
  //   //TODO: check it redirects to the home page after login
  // })

  // it('should show an error message if user not found when trying to log in', function () {})

  // it('should not have a cookie after visited logged out route', function () {
  //   cy.visit('/logout')
  // })
})
