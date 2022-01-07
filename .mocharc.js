module.exports = {
  bail: true,
  diff: false,
  extension: ['.test.mjs'],
  'no-exit': true,
  'fail-zero': true,
  recursive: true,
  reporter: ['list'],
  require: ['./env-checker.cjs', 'tests/hooks.test.mjs'],
  ignore: ['tests/__mocks/**/*', 'tests/cypress/**/*', 'tests/seed-data/**/*'],
}
