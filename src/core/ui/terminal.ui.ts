import { styleText } from 'node:util';

import { CliError } from '@/core/errors/cli.error';

/** `isTTY` is stdout, not stderr. */
export type TerminalContext = {
	isTTY?: boolean;
	env?: NodeJS.ProcessEnv;
	columns?: number | undefined;
};

/** A prompt reads stdin, which is a different question from stdout. */
export const isInteractive = (context: TerminalContext = {}): boolean => {
	const isTTY = context.isTTY ?? process.stdout.isTTY === true;
	const env = context.env ?? process.env;
	const ci = env['CI'];
	// A pty with 0 columns makes a cursor-rendering loop spin forever.
	const columns = context.columns ?? process.stdout.columns;

	return isTTY && (columns ?? 0) > 0 && (ci === undefined || ci === '' || ci === '0' || ci === 'false');
};

export const helpTitle = (title: string): string => {
	return styleText(['bold', 'yellow'], title);
};

export const nextStepLines = (
	commands: readonly string[],
	stream: NodeJS.WritableStream = process.stdout
): string[] => {
	return commands.map((command) => {
		return `     ${styleText('dim', '$ ', { stream })}${styleText('cyan', command, { stream })}`;
	});
};

export const nextStepBlock = (
	label: string,
	commands: readonly string[],
	stream: NodeJS.WritableStream = process.stdout
): string[] => {
	return [`   ${label}:`, ...nextStepLines(commands, stream)];
};

export const renderError = (error: unknown): void => {
	const message = error instanceof Error ? error.message : String(error);
	const stderr = { stream: process.stderr };

	process.stderr.write(`${styleText('gray', '│', stderr)}\n`);

	const [firstLine = message, ...restLines] = message.split('\n');

	process.stderr.write(`${styleText('gray', '└', stderr)}  ${styleText('red', firstLine, stderr)}\n`);

	for (const line of restLines) {
		process.stderr.write(`${line === '' ? '' : `   ${line}`}\n`);
	}

	if (error instanceof CliError && error.commands !== undefined && error.commands.length > 0) {
		for (const line of nextStepBlock(error.label ?? 'To finish', error.commands, process.stderr)) {
			process.stderr.write(`${line}\n`);
		}
	}

	if (error instanceof CliError && error.hint) {
		process.stderr.write(`${styleText('yellow', `   ↳ ${error.hint}`, stderr)}\n`);
	}
};
