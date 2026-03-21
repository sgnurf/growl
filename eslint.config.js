import js from '@eslint/js';
import ts from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import svelte from 'eslint-plugin-svelte';
import svelteParser from 'svelte-eslint-parser';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default [
    // Global ignores (replaces .eslintignore)
    {
        ignores: [
            '.DS_Store',
            'node_modules/**',
            'build/**',
            '.svelte-kit/**',
            'package/**',
            '.env',
            '.env.*',
            '!.env.example',
            'pnpm-lock.yaml',
            'package-lock.json',
            'yarn.lock'
        ]
    },

    // JS/TS files
    {
        files: ['**/*.{js,mjs,cjs,ts}'],
        plugins: { '@typescript-eslint': ts },
        languageOptions: {
            parser: tsParser,
            parserOptions: { sourceType: 'module', ecmaVersion: 2020 },
            globals: { ...globals.browser, ...globals.node, ...globals.es2020 }
        },
        rules: {
            ...js.configs.recommended.rules,
            ...ts.configs.recommended.rules,
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/no-unused-vars': [
                'error',
                { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }
            ]
        }
    },

    // Svelte files
    {
        files: ['**/*.svelte'],
        plugins: { svelte, '@typescript-eslint': ts },
        languageOptions: {
            parser: svelteParser,
            parserOptions: { parser: tsParser },
            globals: { ...globals.browser }
        },
        rules: {
            ...svelte.configs.recommended.rules,
            '@typescript-eslint/no-explicit-any': 'warn'
        }
    },

    // Test files — add Vitest globals
    {
        files: ['**/*.test.{js,ts}', '**/*.spec.{js,ts}'],
        languageOptions: {
            globals: {
                test: 'readonly',
                expect: 'readonly',
                describe: 'readonly',
                it: 'readonly',
                beforeEach: 'readonly',
                afterEach: 'readonly',
                beforeAll: 'readonly',
                afterAll: 'readonly',
                vi: 'readonly'
            }
        }
    },

    // Prettier must be last to disable conflicting formatting rules
    prettier
];
