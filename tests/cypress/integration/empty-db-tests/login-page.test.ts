/// <reference types="cypress" />

describe('The Home Page', function () {
  it('successfully loads', function () {
    cy.visit('http://0.0.0.0:8080')
  })
})
