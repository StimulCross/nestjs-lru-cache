#!/usr/bin/env node

// TAKEN FROM https://github.com/twurple/twurple/blob/main/publish.mjs

import { exec as _exec, spawn } from 'child_process';
import util from 'util';

const exec = util.promisify(_exec);

async function runYarn(args) {
	const isWindows = /^win/.test(process.platform);
	return runAndPassOutput(isWindows ? 'yarn.cmd' : 'yarn', args);
}

async function runAndPassOutput(cmd, args) {
	return new Promise(resolve => {
		const proc = spawn(cmd, args, {
			stdio: 'inherit'
		});
		proc.on('exit', code => {
			if (code) {
				console.error(`subprocess exited with code ${code}; cmdline: ${[cmd, ...args].join(' ')}`);
				process.exit(1);
			} else {
				resolve();
			}
		});
	});
}

await runAndPassOutput('git', ['remote', 'update']);
const localRev = (await exec('git rev-parse "@"')).stdout.trimEnd();
const remoteRev = (await exec('git rev-parse "@{u}"')).stdout.trimEnd();
const baseRev = (await exec('git merge-base "@" "@{u}"')).stdout.trimEnd();

if (localRev !== remoteRev && remoteRev !== baseRev) {
	console.log({ localRev, remoteRev, baseRev });
	console.error('Your local repository is out of date; please pull');
	process.exit(1);
}

await runYarn(['rebuild']);
await runYarn(['lint']);
await runYarn(['format:check']);

const versionType = process.argv[2] ?? 'patch';

await runAndPassOutput('npm', [
	'version',
	'--commit-hooks',
	'false',
	'--preid',
	'pre',
	versionType,
	'-m',
	'build: release version %v'
]);

if (versionType.startsWith('pre')) {
	await runAndPassOutput('npm', ['publish', '--tag', 'next']);
} else {
	await runAndPassOutput('npm', ['publish']);
}
