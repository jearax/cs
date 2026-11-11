import { runAliasRemove } from '@/commands/alias/services/alias-remove.service';
import { runAlias } from '@/commands/alias/services/alias.service';
import { showBinPathNotice } from '@/core/ui/artifact.ui';
import { examplesText } from '@/core/ui/help-examples.ui';

import type { Command } from 'commander';

const EXAMPLE_ROWS: ReadonlyArray<readonly [string, string]> = [
	['cs alias planner work', 'Create claude-planner, running the work profile'],
	['cs alias planner other', 'Re-point claude-planner to the other profile'],
	['cs alias remove planner', 'Delete the planner alias and its claude-planner launcher']
];

const REMOVE_EXAMPLE_ROWS: ReadonlyArray<readonly [string, string]> = [
	['cs alias remove planner', 'Delete the planner alias and its claude-planner launcher']
];

export const registerAliasCommand = (program: Command): void => {
	const aliasCommand = program
		.command('alias <name> <profile>')
		.description('Create or re-point the claude-<name> launcher: a standalone claude command bound to a profile')
		.addHelpText('after', examplesText(EXAMPLE_ROWS))
		.action(async (name: string, profile: string) => {
			const result = await runAlias(name, profile);

			for (const notice of result.notices) {
				process.stderr.write(`   ! ${notice}\n`);
			}

			const verb = result.replaced ? 're-pointed' : 'created';

			process.stdout.write(`Alias "${result.name}" ${verb} at profile "${result.profile}".\n`);
			process.stdout.write(`Launcher: ${result.launcherPath}\n`);
			showBinPathNotice(result.binPath, '');
		});

	aliasCommand
		.command('remove <aliases...>')
		.alias('rm')
		.description('Remove an alias and its claude-<name> launcher')
		.addHelpText('after', examplesText(REMOVE_EXAMPLE_ROWS))
		.action(async (aliases: string[]) => {
			const result = await runAliasRemove(aliases);

			for (const notice of result.notices) {
				process.stderr.write(`   ! ${notice}\n`);
			}

			for (const entry of result.removed) {
				process.stdout.write(`Alias "${entry.name}" removed (was → ${entry.profile}).\n`);
				process.stdout.write(`Launcher: ${entry.launcherPath}\n`);
			}
		});
};
