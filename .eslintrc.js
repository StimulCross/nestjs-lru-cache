const baseRules = require('@stimulcross/eslint-config-typescript/style');

const memberNames = ['^noUpdateTTL$', '^getRemainingTTL$'];

const namingConvention = [...baseRules.rules['@typescript-eslint/naming-convention']].map(rule => {
	if (typeof rule === 'object') {
		if (rule.selector === 'default' && !rule.modifiers) {
			return {
				...rule,
				filter: {
					match: false,
					regex: [...memberNames].join('|')
				}
			};
		}
		if (rule.selector === 'memberLike' && !rule.modifiers) {
			return {
				...rule,
				filter: {
					match: false,
					regex: [...memberNames].join('|')
				}
			};
		}
	}

	return rule;
});

module.exports = {
	extends: [
		'@stimulcross/eslint-config-node',
		'@stimulcross/eslint-config-typescript',
		'@stimulcross/eslint-config-typescript/style'
	],
	parserOptions: {
		project: './tsconfig.json'
	},
	root: true,
	env: {
		node: true,
		jest: true
	},
	ignorePatterns: ['.eslintrc.js'],
	rules: {
		'import/no-unused-modules': 'off',
		'@typescript-eslint/explicit-member-accessibility': 'off',
		'@typescript-eslint/no-explicit-any': 'off',
		'@typescript-eslint/unified-signatures': 'off',
		'@typescript-eslint/naming-convention': namingConvention,
		'@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }]
	}
};
