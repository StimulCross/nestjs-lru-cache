module.exports = {
	extends: [
		'@stimulcross/eslint-config-node',
		'@stimulcross/eslint-config-typescript',
		'@stimulcross/eslint-config-typescript/style'
	],
	parserOptions: {
		project: './tsconfig.json'
	}
};
