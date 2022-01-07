// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })

import * as RA from 'ramda-adjunct'

const testingDefaultUser = Cypress.env('TESTING_DEFAULT_USER') as string

Cypress.Commands.add('login', () =>
  cy.getCookie('loggedInUser').then(cookie =>
    cookie
      ? RA.noop()
      : cy.setCookie('loggedInUser', testingDefaultUser, {
          httpOnly: true,
          sameSite: 'strict',
        })
  )
)

Cypress.Commands.add('logout', () => cy.clearCookie('loggedInUser'))
