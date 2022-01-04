module.exports = {
  bail: true,
  diff: false,
  extension: ['.test.ts'],
  'no-exit': true,
  'fail-zero': true,
  recursive: true,
  reporter: ['list'],
  loader: 'ts-node/esm',
  require: ['source-map-support', './env-checker.cjs', 'tests/hooks.test.ts'],
  ignore: ['tests/__mocks/**/*', 'tests/cypress/**/*', 'tests/seed-data/**/*'],
}
