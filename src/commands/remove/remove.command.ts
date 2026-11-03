import { runRemove } from '@/commands/remove/services/remove.service';

import type { Command } from 'commander';

export const registerRemoveCommand = (program: Command): void => {
	program
		.command('remove <profile>')
		.description('Remove a profile')
		.action(async (name: string) => {
			const result = await runRemove(name);

			for (const notice of result.notices) {
				process.stderr.write(`   ! ${notice}\n`);
			}

			process.stdout.write(`Profile "${result.name}" removed.\n`);

			if (result.cleanedAliases.length > 0) {
				process.stdout.write(`Removed aliases: ${result.cleanedAliases.join(', ')}\n`);
			}
		});
};
