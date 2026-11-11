import { runRemove } from '@/commands/remove/services/remove.service';
import { examplesText } from '@/core/ui/help-examples.ui';

import type { Command } from 'commander';

const EXAMPLE_ROWS: ReadonlyArray<readonly [string, string]> = [
	['cs remove work', 'Delete work and its artifact; the aliases pointing at it go too']
];

export const registerRemoveCommand = (program: Command): void => {
	program
		.command('remove <profile...>')
		.alias('rm')
		.description('Remove a profile')
		.addHelpText('after', examplesText(EXAMPLE_ROWS))
		.action(async (names: string[]) => {
			const result = await runRemove(names);

			for (const notice of result.notices) {
				process.stderr.write(`   ! ${notice}\n`);
			}

			for (const entry of result.removed) {
				process.stdout.write(`Profile "${entry.name}" removed.\n`);

				if (entry.cleanedAliases.length > 0) {
					process.stdout.write(`Removed aliases: ${entry.cleanedAliases.join(', ')}\n`);
				}
			}
		});
};
