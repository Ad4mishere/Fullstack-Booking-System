import js from '@eslint/js';

export default [

  js.configs.recommended,


  {
    files: ['**/*.js'],
    ignores: [
      'node_modules/**',
      'database.db',
      'playwright-report/**',
      'test-results/**'
    ],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        process: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly'
      }
    },
    rules: {
      'no-unused-vars': 'warn',
      'no-console': 'off'
    }
  },


  {
  files: ['src/frontend/**/*.js'],
  languageOptions: {
    globals: {
      document: 'readonly',
      fetch: 'readonly',
      window: 'readonly',
      setTimeout: 'readonly',
      localStorage: 'readonly',
      crypto: 'readonly'
    }
  }
}
];
