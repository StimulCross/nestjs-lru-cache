import { exec as _exec, spawn } from 'node:child_process';
import util from 'node:util';

const exec = util.promisify(_exec);

async function runYarn(args) {
	const isWindows = process.platform.startsWith('win');
	return await runAndPassOutput(isWindows ? 'yarn.cmd' : 'yarn', args);
}

async function runNpm(args) {
	const isWindows = process.platform.startsWith('win');
	return await runAndPassOutput(isWindows ? 'npm.cmd' : 'npm', args);
}

async function runAndPassOutput(cmd, args) {
	return await new Promise(resolve => {
		const proc = spawn(cmd, args, {
			stdio: 'inherit',
		});
		proc.on('exit', code => {
			if (code) {
				throw new Error(`subprocess exited with code ${code}; cmdline: ${[cmd, ...args].join(' ')}`);
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
	throw new Error('Your local repository is out of date; please pull');
}

await runYarn(['rebuild']);
await runYarn(['lint']);
await runYarn(['format:check']);

const versionType = process.argv[2] ?? 'patch';

await runNpm(['version', '--commit-hooks', 'false', '--preid', 'next', versionType, '-m', 'build: release version %s']);

await (versionType.startsWith('pre') ? runNpm(['publish', '--tag', 'next']) : runNpm(['publish']));
