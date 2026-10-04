import js from '@eslint/js'
import prettier from 'eslint-config-prettier'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default defineConfig([
  globalIgnores(['dist', '.netlify']),
  {
    files: ['**/*.{ts,tsx,js}'],
    extends: [js.configs.recommended, tseslint.configs.recommended, prettier],
    languageOptions: { ecmaVersion: 2023 },
  },
  // Frontend: browser code, React
  {
    files: ['src/frontend/**/*.{ts,tsx}'],
    extends: [reactHooks.configs.flat.recommended, reactRefresh.configs.vite],
    languageOptions: { globals: globals.browser },
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/backend/**'],
              message: 'Frontend must not import backend code; move shared code to src/shared.',
            },
          ],
        },
      ],
    },
  },
  // Backend: Node code (functions, scripts, MCP) and root tool configs
  {
    files: ['src/backend/**/*.ts', '*.{ts,js}'],
    languageOptions: { globals: globals.node },
  },
  {
    files: ['src/backend/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/frontend/**'],
              message: 'Backend must not import frontend code; move shared code to src/shared.',
            },
          ],
        },
      ],
    },
  },
  // Shared: runs in browser and Node, so it may import neither side
  {
    files: ['src/shared/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/frontend/**', '**/backend/**'],
              message: 'Shared code must not depend on frontend or backend.',
            },
          ],
        },
      ],
    },
  },
])
