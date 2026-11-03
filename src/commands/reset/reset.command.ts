import { runReset } from '@/commands/reset/services/reset.service';

import type { Command } from 'commander';

export const registerResetCommand = (program: Command): void => {
	program
		.command('reset')
		.description('Reset to the default profile')
		.action(async () => {
			const result = await runReset();

			for (const notice of result.notices) {
				process.stderr.write(`   ! ${notice}\n`);
			}

			if (result.removed.length > 0) {
				process.stdout.write(`Removed profiles: ${result.removed.join(', ')}\n`);
			}

			if (result.cleanedAliases.length > 0) {
				process.stdout.write(`Removed aliases: ${result.cleanedAliases.join(', ')}\n`);
			}

			process.stdout.write('Reset complete. Active profile: default\n');
		});
};
