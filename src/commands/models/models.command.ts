import { KNOWN_MODELS } from '@/modules/profiles/constants/models.constant';

import type { Command } from 'commander';

export const registerModelsCommand = (program: Command): void => {
	program
		.command('models')
		.description('List the known model IDs')
		.action(() => {
			for (const model of KNOWN_MODELS) {
				process.stdout.write(`${model}\n`);
			}

			process.stdout.write(
				'\nPaste a dotted ID as the provider prints it: cs config turns claude-opus-4.7 into claude-opus-4-7. Append [1m] to any ID for the 1M context window.\n'
			);
		});
};
