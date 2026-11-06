import { runRemove } from '@/commands/remove/services/remove.service';
import { examplesText } from '@/core/ui/help-examples.ui';

import type { Command } from 'commander';

const EXAMPLE_ROWS: ReadonlyArray<readonly [string, string]> = [
	['cs remove work', 'Delete work and its artifact; the aliases pointing at it go too']
];

export const registerRemoveCommand = (program: Command): void => {
	program
		.command('remove <profile>')
		.alias('rm')
		.description('Remove a profile')
		.addHelpText('after', examplesText(EXAMPLE_ROWS))
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
