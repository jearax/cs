import { runReset } from '@/commands/reset/services/reset.service';
import { examplesText } from '@/core/ui/help-examples.ui';

import type { Command } from 'commander';

const EXAMPLE_ROWS: ReadonlyArray<readonly [string, string]> = [
	['cs reset', 'Keep only the default profile and re-activate it']
];

export const registerResetCommand = (program: Command): void => {
	program
		.command('reset')
		.description('Reset to the default profile')
		.addHelpText('after', examplesText(EXAMPLE_ROWS))
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
