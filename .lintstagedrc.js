module.exports = {
	'*.{js,mjs,ts,json,md}': 'prettier --config ".prettierrc.js" --write ',
	'src/*.{js,ts}': 'eslint .',
};
