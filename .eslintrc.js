module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: { project: 'tsconfig.json', tsconfigRootDir: __dirname, sourceType: 'module' },
  plugins: ['@typescript-eslint'],
  extends: ['plugin:@typescript-eslint/recommended', 'prettier'],
  env: { node: true, jest: true },
  ignorePatterns: ['.eslintrc.js', '.dependency-cruiser.js', 'dist', 'coverage', 'legacy', 'docs', 'src/generated'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-console': 'error',
    eqeqeq: ['error', 'always'],
    // security-and-audit.md §11: no unsafe raw SQL.
    'no-restricted-properties': [
      'error',
      { property: '$queryRawUnsafe', message: 'Use the $queryRaw tagged template (parameterised).' },
      { property: '$executeRawUnsafe', message: 'Use the $executeRaw tagged template (parameterised).' },
    ],
  },
};
