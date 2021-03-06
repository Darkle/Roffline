module.exports = {
  root: true,
  parserOptions: {
    ecmaVersion: 2020,
  },
  processor: 'disable/disable',
  globals: {},
  env: {
    browser: true,
    node: true,
    es2020: true,
  },
  extends: ['eslint:recommended', 'airbnb-base', 'xo', 'plugin:import/errors'],
  settings: {
    'html/html-extensions': ['.html', '.eta', '.njk', 'marko'],
  },
  ignorePatterns: ['.eslintrc.cjs', 'tests/**/*'],
  plugins: ['@typescript-eslint', 'functional', 'extra-rules', 'no-secrets', 'disable', 'html', 'ramda', 'mocha'],
  overrides: [
    {
      parser: '@typescript-eslint/parser',
      extends: [
        'eslint:recommended',
        'airbnb-base',
        'xo',
        'plugin:@typescript-eslint/recommended',
        'plugin:@typescript-eslint/recommended-requiring-type-checking',
        'plugin:functional/recommended',
        'plugin:import/errors',
        'plugin:import/typescript',
        'plugin:compat/recommended',
        'plugin:escompat/recommended',
        'plugin:security/recommended',
        'plugin:ramda/recommended',
        'plugin:mocha/recommended',
        'plugin:eslint-comments/recommended',
      ],
      files: [
        'db/**/*.ts',
        'downloads/**/*.ts',
        'logging/**/*.ts',
        'server/**/*.ts',
        './boot.ts',
        'frontend/**/*.ts',
        './TasksFile.ts',
      ],
      parserOptions: {
        tsconfigRootDir: __dirname,
        project: ['./tsconfig.json'],
        sourceType: 'module',
        ecmaFeatures: {
          globalReturn: true,
          impliedStrict: true,
          modules: true,
        },
      },
      rules: {
        '@typescript-eslint/consistent-type-imports': 'error',
        '@typescript-eslint/default-param-last': ['error'],
        '@typescript-eslint/explicit-function-return-type': ['error'],
        '@typescript-eslint/no-floating-promises': 'off',
        '@typescript-eslint/unbound-method': 'off',
        '@typescript-eslint/no-duplicate-imports': ['error'],
        '@typescript-eslint/no-magic-numbers': [
          'error',
          { ignoreArrayIndexes: true, enforceConst: true, detectObjects: true, ignore: [0, 1, 2, -1] },
        ],
        '@typescript-eslint/no-shadow': ['error'],
        '@typescript-eslint/no-unnecessary-type-assertion': 'off',
        '@typescript-eslint/no-unused-expressions': [
          'error',
          { allowTernary: true, allowTaggedTemplates: true, allowShortCircuit: true },
        ],
        '@typescript-eslint/no-unused-vars': ['error', { args: 'after-used', argsIgnorePattern: '_' }],
        '@typescript-eslint/no-use-before-define': ['error'],
        '@typescript-eslint/no-useless-constructor': ['error'],
        '@typescript-eslint/prefer-readonly-parameter-types': 'off',
        '@typescript-eslint/prefer-readonly': ['error'],
        '@typescript-eslint/prefer-reduce-type-parameter': ['error'],
        '@typescript-eslint/require-await': 'error',
        '@typescript-eslint/semi': [
          'error',
          'never',
          {
            beforeStatementContinuationChars: 'always',
          },
        ],
        '@typescript-eslint/space-infix-ops': ['error', { int32Hint: false }],
        'functional/no-return-void': 'off',
        'functional/no-class': 'off',
        'functional/no-expression-statement': 'off',
        'functional/no-this-expression': 'off',
        'functional/prefer-readonly-type': 'off',
        'functional/no-mixed-type': 'off',
        'functional/immutable-data': [
          'error',
          {
            ignoreImmediateMutation: true,
            ignorePattern: [
              'window\\.loginPage',
              'window\\.csrfToken',
              'this\\.userIsLoggingIn',
              'reply\\.locals\\.',
              'replyWithLocals\\.locals\\.',
              'this\\.volume',
              'window\\.globalVolumeStore',
              'videoElement\\.volume',
              'volume\\.value',
              'muted\\.value',
              'page\\.value',
              'this\\.observer',
              'this\\.posts',
              'this\\.componentHasBeenInView',
              'app\\.config\\.warnHandler',
              'post\\.comments',
              'signupInput\\.',
              'successfullyBulkImportedSubs\\.value',
              'errorBulkImportingSubs\\.value',
              'bulkImportTextArea\\.value',
              'disableBulkImport\\.value',
              'bulkSubImportErrorMessageElem\\.textContent',
              'this\\.commentsClosed',
              'this\\.subredditThatWasAddedOrRemoved',
              'this\\.subredditWasAdded',
              'this\\.subredditWasRemoved',
              'state\\.*',
              'this\\.mediaDownloadsCompleted',
              'this\\.mediaDownloadsErrored',
              'this\\.posts',
              'mediaDownloadsInfo\\.posts',
              'download.\\.*',
            ],
          },
        ],
        'functional/functional-parameters': 'off',
        'functional/prefer-tacit': 'error',
        'import/extensions': 'off',
        'import/newline-after-import': 'off',
        'import/prefer-default-export': 'off',
        'import/no-unresolved': 'off',
        'extra-rules/potential-point-free': 'error',
        'eslint-comments/disable-enable-pair': 'off',
        'no-secrets/no-secrets': ['error', { tolerance: 4.5 }],
        'ramda/no-redundant-and': 'off',
        'ramda/prefer-ramda-boolean': 'off',
        'mocha/no-hooks-for-single-case': 'off',
        'security/detect-non-literal-fs-filename': 'off',
        'security/detect-object-injection': 'off',
        'array-callback-return': 'error',
        camelcase: 'off',
        'capitalized-comments': ['off'],
        complexity: ['error', 4],
        'consistent-return': 'off',
        'comma-dangle': 'off',
        'dot-notation': 'off',
        'no-underscore-dangle': 'off',
        'eol-last': 'off',
        eqeqeq: 'error',
        'function-paren-newline': 'off',
        'generator-star-spacing': 'off',
        'guard-for-in': 'error',
        'global-require': 'off',
        'implicit-arrow-linebreak': 'off',
        indent: 'off',
        'max-depth': ['error', 3],
        'max-lines-per-function': ['error', { max: 24, skipComments: true }],
        'max-len': 'off',
        'max-params': ['error', 4],
        'max-statements-per-line': ['error', { max: 1 }],
        'new-cap': 'off',
        'newline-per-chained-call': 'off',
        'no-await-in-loop': 'error',
        'no-console': 'off',
        'no-confusing-arrow': 'off',
        'no-duplicate-imports': 'off',
        'no-debugger': 'warn',
        'no-else-return': 'error',
        'no-extra-semi': 'off',
        'no-eq-null': 'error',
        'no-magic-numbers': 'off',
        'no-nested-ternary': 'off',
        'no-negated-condition': 'off',
        'no-param-reassign': [
          'error',
          {
            props: true,
            ignorePropertyModificationsFor: ['store', 'res', 'reply', 'download'],
          },
        ],
        'no-plusplus': 'error',
        'no-return-await': 'error',
        'no-return-assign': ['error', 'except-parens'],
        'no-shadow': 'off',
        'no-undef-init': 'error',
        'no-unneeded-ternary': ['error', { defaultAssignment: true }],
        'no-unused-vars': 'off',
        'no-use-before-define': 'off',
        'no-useless-constructor': 'off',
        'no-unused-expressions': 'off',
        'no-useless-return': 'error',
        'object-curly-spacing': 'off',
        'object-curly-newline': 'off',
        'operator-assignment': ['error', 'never'],
        'operator-linebreak': 'off',
        quotes: [
          'error',
          'single',
          {
            avoidEscape: true,
            allowTemplateLiterals: true,
          },
        ],
        radix: 'error',
        'require-atomic-updates': 'error',
        'require-unicode-regexp': 'error',
        'require-await': 'off',
        semi: 'off',
        'spaced-comment': 'off',
        'space-infix-ops': 'off',
      },
    },
  ],
  rules: {
    'array-callback-return': 'error',
    camelcase: 'off',
    'capitalized-comments': ['off'],
    complexity: ['error', 4],
    'consistent-return': 'error',
    'comma-dangle': 'off',
    'dot-notation': 'off',
    'eol-last': 'off',
    eqeqeq: 'error',
    'function-paren-newline': 'off',
    'generator-star-spacing': 'off',
    'guard-for-in': 'error',
    'global-require': 'off',
    'implicit-arrow-linebreak': 'off',
    indent: 'off',
    'max-depth': ['error', 3],
    'max-lines-per-function': ['error', { max: 24, skipComments: true }],
    'max-len': 'off',
    'max-params': ['error', 4],
    'max-statements-per-line': ['error', { max: 1 }],
    'new-cap': 'off',
    'newline-per-chained-call': 'off',
    'no-await-in-loop': 'error',
    'no-console': 'off',
    'no-confusing-arrow': 'off',
    'no-duplicate-imports': 'off',
    'no-debugger': 'warn',
    'no-else-return': 'error',
    'no-eq-null': 'error',
    'no-magic-numbers': 'off',
    'no-nested-ternary': 'off',
    'no-param-reassign': [
      'error',
      {
        props: true,
        ignorePropertyModificationsFor: ['store', 'res'],
      },
    ],
    'no-plusplus': 'error',
    'no-return-await': 'error',
    'no-return-assign': ['error', 'except-parens'],
    'no-shadow': 'off',
    'no-undef-init': 'error',
    'no-unneeded-ternary': ['error', { defaultAssignment: true }],
    'no-unused-vars': 'off',
    'no-use-before-define': 'off',
    'no-useless-constructor': 'off',
    'no-unused-expressions': 'off',
    'no-useless-return': 'error',
    'object-curly-spacing': 'off',
    'object-curly-newline': 'off',
    'operator-assignment': ['error', 'never'],
    'operator-linebreak': 'off',
    quotes: [
      'error',
      'single',
      {
        avoidEscape: true,
        allowTemplateLiterals: true,
      },
    ],
    radix: 'error',
    'require-atomic-updates': 'error',
    'require-unicode-regexp': 'error',
    'require-await': 'off',
    semi: 'off',
    'spaced-comment': 'off',
    'space-infix-ops': 'off',
  },
}
