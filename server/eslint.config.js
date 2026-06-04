import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
    js.configs.recommended,
    {
        files: ['src/**/*.ts'],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                project: './tsconfig.json',
                tsconfigRootDir: import.meta.dirname,
            },
        },
        plugins: {
            '@typescript-eslint': tsPlugin,
        },
        rules: {
            ...tsPlugin.configs['recommended'].rules,
            '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
            '@typescript-eslint/explicit-function-return-type': 'off',
            '@typescript-eslint/no-explicit-any': 'warn',
            'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
        },
    },
    {
        ignores: ['dist/**', 'node_modules/**', '**/*.test.ts', '**/*.spec.ts'],
    },
];
