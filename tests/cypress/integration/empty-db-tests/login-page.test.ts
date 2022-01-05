/// <reference types="cypress" />

describe('Login Page', function () {
  before(function () {
    cy.visit('/logout')
  })

  it('Not logged in redirects to login page', function () {
    cy.task('log', Cypress.env().TESTING_DEFAULT_USER)
    cy.visit('/')
    cy.location('pathname').should('eq', '/login')
  })

  it('it should have the following html', function () {
    cy.visit('/login')
    cy.get('form').contains(`Roffline doesn't use passwords, but rather unique usernames.`)
    cy.get('form').contains(`Copy the username below & save it. Then click the signup button.`)
  })

  it('it should have the following page title', function () {
    cy.visit('/login')
    cy.title().should('eq', 'Roffline - Login')
  })

  xit('it should copy new username to clipboard when click on button to do so', function () {})

  xit('it should show different tab when you click on another tab', function () {})

  xit('it should generate a random username', function () {
    //https://docs.cypress.io/guides/core-concepts/introduction-to-cypress#Avoid-loops
  })

  xit('it should login with new user when click on login button', function () {
    //remove the new user after its logged in
  })

  xit('it should login with existing user when click on login button', function () {})

  xit('it should create a cookie with the name we used to login for new user', function () {})

  xit('it should create a cookie with the name we used to login for existing user', function () {})

  xit('it should redirect to the home page after login', function () {})

  xit('it should not have a cookie', function () {
    cy.visit('/logout')
  })

  after(function () {
    //TODO: log back in here with https://docs.cypress.io/guides/getting-started/testing-your-app#Bypassing-your-UI
  })
})
