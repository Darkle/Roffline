/// <reference types="cypress" />

const path = require('path')

const testingDotEnv = require('dotenv').config({ path: path.join(process.cwd(), 'tests', '.testing.env') })

// ***********************************************************
// This example plugins/index.js can be used to load plugins
//
// You can change the location of this file or turn off loading
// the plugins file with the 'pluginsFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/plugins-guide
// ***********************************************************

// This function is called when a project is opened or re-opened (e.g. due to
// the project's config changing)

/**
 * @type {Cypress.PluginConfig}
 */
module.exports = (on, config) => {
  // https://stackoverflow.com/a/57819466/2785644
  config.env = { ...config.env, ...testingDotEnv.parsed }

  // https://stackoverflow.com/a/52077306/2785644
  on('task', {
    log(message) {
      console.log(message)
      return null
    },
  })

  return config
}
