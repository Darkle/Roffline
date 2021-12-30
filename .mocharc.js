module.exports = {
  bail: true,
  diff: false,
  extension: ['.test.ts'],
  exit: true,
  loader: 'ts-node/esm',
  recursive: true,
  require: ['./env-checker.cjs', 'tests/hooks.test.ts'],
  ignore: ['tests/__mocks', 'tests/seed-data'],
}
