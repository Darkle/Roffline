/// <reference types="cypress" />
/// <reference types="node" />

import { isDev } from '../../../../server/utils'

console.log(isDev)

describe('Header', function () {
  before(function () {
    cy.login()
  })

  // it('should asd', function () {})

  // it('should sdfsdf', function () {})
})
