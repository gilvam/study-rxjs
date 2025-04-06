module.exports = {
	preset: 'jest-preset-angular',
	setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
	watchPathIgnorePatterns: ['<rootDir>/node_modules']
};

// module.exports = {
// 	preset: 'jest-preset-angular',
// 	setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
// 	testMatch: ['**/+(*.)+(spec).+(ts)'],
// 	transform: { '^.+\\.(ts|js|mjs|html)$': 'ts-jest' },
// 	moduleFileExtensions: ['ts', 'html', 'js', 'json'],
// 	watchPathIgnorePatterns: ['<rootDir>/node_modules'],
// 	testEnvironment: 'jsdom',
// 	globals: {
// 		'ts-jest': {
// 			tsconfig: '<rootDir>/tsconfig.spec.json',
// 			stringifyContentPathRegex: '\\.html$',
// 			diagnostics: false
// 		}
// 	}
// };
