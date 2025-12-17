import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import complexity from 'eslint-plugin-complexity';

export default [
  // Base configuration for JavaScript
  js.configs.recommended,

  // TypeScript configuration
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2017,
        sourceType: 'module',
        project: './tsconfig.json'
      }
    },
    plugins: {
      '@typescript-eslint': tseslint,
      complexity: complexity
    },
    rules: {
      // TypeScript recommended rules
      ...tseslint.configs.recommended.rules,

      // Additional rules for VS Code extensions
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/no-var-requires': 'off', // Common in VS Code extensions

      // General code quality rules
      'no-console': 'off', // VS Code extensions often use console for debugging
      'no-debugger': 'error',
      'no-duplicate-imports': 'error',
      'prefer-const': 'error',
      'no-unused-expressions': 'error',
      'eqeqeq': ['error', 'always'],
      'curly': ['error', 'all'],
      'no-eval': 'error',
      'no-implied-eval': 'error',

      // Security-related rules
      'no-new-func': 'error',
      'no-script-url': 'error',

      // Code complexity rules
      'complexity': ['error', 10], // Maximum cyclomatic complexity of 10
    }
  },

  // JavaScript files (compiled output)
  {
    files: ['out/**/*.js'],
    languageOptions: {
      ecmaVersion: 2017,
      sourceType: 'commonjs',
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        exports: 'writable',
        require: 'readonly',
        module: 'readonly'
      }
    },
    rules: {
      // Relaxed rules for compiled output
      'no-unused-vars': 'off',
      'no-undef': 'off'
    }
  },

  // Exclude patterns
  {
    ignores: [
      'node_modules/**',
      'out/**',
      '**/*.d.ts',
      'test_files/**',
      'tests/**',
      '*.vsix'
    ]
  }
];
