import { main } from '@/cli';

import { capture } from './capture-stream';

export type CliRun = {
	stdout: string;
	stderr: string;
	exitCode: number;
};

/** The CLI runs in-process, so the exit code of one run never leaks into the next. */
export const runCli = async (args: string[]): Promise<CliRun> => {
	const previousExitCode = process.exitCode;

	process.exitCode = undefined;

	let stdout = '';

	const stderr = await capture(process.stderr, async () => {
		stdout = await capture(process.stdout, async () => {
			await main(['node', 'cs', ...args], { exitOverride: true });
		});
	});

	const exitCode = process.exitCode ?? 0;

	process.exitCode = previousExitCode;

	return {
		stdout,
		stderr,
		exitCode
	};
};
