module.exports = {
  bail: true,
  diff: false,
  extension: ['.test.ts'],
  'no-exit': true,
  'fail-zero': true,
  recursive: true,
  loader: 'ts-node/esm',
  require: ['./env-checker.cjs', 'tests/hooks.test.ts'],
  ignore: ['tests/__mocks', 'tests/seed-data'],
}
