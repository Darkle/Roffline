/// <reference types="cypress" />
/// <reference types="node" />

import path from 'path'

import { isDev } from '../../../../server/utils'

console.log(isDev)

describe('Home Page', function () {
  before(function () {
    cy.task('log', path.join(process.cwd(), 'hello'))
    // Get the login name via shell cy.exec or other means
    //login here if cant set cookie whith cy.visit()
  })

  xit('it should show welcome screen when user has no subs', function () {})

  xit('it should show the downloading posts message when user has 1 or more subs', function () {})
})
