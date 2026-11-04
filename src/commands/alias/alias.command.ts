import { runAlias } from '@/commands/alias/services/alias.service';
import { showBinPathNotice } from '@/core/ui/artifact.ui';
import { examplesText } from '@/core/ui/help-examples.ui';
import { binHomePath } from '@/modules/profiles/constants/paths.constant';
import { buildLauncherName } from '@/modules/profiles/services/launcher.service';

import type { Command } from 'commander';

const EXAMPLE_ROWS: ReadonlyArray<readonly [string, string]> = [
	['cs alias planner work', 'Create claude-planner, running the work profile'],
	['cs alias planner other', 'Re-point claude-planner to the other profile']
];

export const registerAliasCommand = (program: Command): void => {
	program
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
			process.stdout.write(`  Launcher: ${binHomePath()}/${buildLauncherName(result.name)}\n`);
			showBinPathNotice(result.binPath);
		});
};
