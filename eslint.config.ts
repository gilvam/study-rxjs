import eslint from '@eslint/js';
import * as tsEslint from 'typescript-eslint';
import * as angular from 'angular-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';

export default [
	eslint.configs.recommended,
	...tsEslint.configs.recommended,
	...tsEslint.configs.recommendedTypeChecked.map((config) => ({
		...config,
		languageOptions: {
			...config.languageOptions,
			parserOptions: {
				...(config.languageOptions?.parserOptions || {}),
				project: ['./tsconfig.json']
			}
		}
	})),
	...tsEslint.configs.stylistic,
	...angular.configs.tsRecommended,
	{
		files: ['**/*.ts'],
		plugins: { prettier: prettierPlugin },
		processor: angular.processInlineTemplates,
		rules: {
			// typescript rules
			// '@typescript-eslint/comma-dangle': 'off',
			// '@typescript-eslint/lines-between-class-members': 'off',
			'@typescript-eslint/no-unsafe-enum-comparison': 'off',
			'@typescript-eslint/no-shadow': 'error',
			'@typescript-eslint/no-explicit-any': 'error',
			'@typescript-eslint/no-unused-vars': 'error',
			'@typescript-eslint/no-namespace': 'error',
			'@typescript-eslint/no-empty-interface': 'error',
			'@typescript-eslint/no-empty-function': 'error',
			'@typescript-eslint/explicit-module-boundary-types': 'error',
			'@typescript-eslint/prefer-readonly': 'error',

			// angular rules
			'@angular-eslint/directive-selector': ['error', { type: 'attribute', prefix: 'app', style: 'camelCase' }],
			'@angular-eslint/component-selector': ['error', { type: 'element', prefix: 'app', style: 'kebab-case' }],
			'@angular-eslint/component-class-suffix': ['error', { suffixes: ['Component', 'Directive', 'Pipe', 'Guard'] }],

			// prettier rules
			...eslintConfigPrettier.rules,
			'prettier/prettier': 'error',

			// other rules
			camelcase: ['error', { allow: ['/^[_][A-Z0-9]*$/'] }]
		}
	},
	{
		files: ['**/*.html'],
		extends: [...angular.configs.templateRecommended, ...angular.configs.templateAccessibility],
		rules: {}
	}
];
