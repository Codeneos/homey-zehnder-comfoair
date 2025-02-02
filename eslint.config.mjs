// @ts-check
import eslint from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// This is just an example default config for ESLint.
// You should change it to your needs following the documentation.
export default tseslint.config(
  {
    ignores: ['**/.homeybuild/**', '**/tmp/**', '**/coverage/**', 'node_modules/**'],
  },
  eslint.configs.recommended,
  // @ts-ignore
  eslintConfigPrettier,
  {
    extends: [...tseslint.configs.recommended],

    files: ['src/**/*.ts', 'src/**/*.mts'],

    plugins: {
      '@typescript-eslint': tseslint.plugin,
    },

    rules: {
      '@typescript-eslint/explicit-function-return-type': 'off'
    },

    languageOptions: {
      parser: tseslint.parser,
      ecmaVersion: 2020,
      sourceType: 'module',

      globals: {
        ...globals.node,
      },

      parserOptions: {
        project: './tsconfig.json',
      },
    },
  }
);
