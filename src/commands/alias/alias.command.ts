import { runAlias } from '@/commands/alias/services/alias.service';
import { showBinPathNotice } from '@/core/ui/artifact.ui';
import { binHomePath } from '@/modules/profiles/constants/paths.constant';
import { buildLauncherName } from '@/modules/profiles/services/launcher.service';

import type { Command } from 'commander';

export const registerAliasCommand = (program: Command): void => {
	program
		.command('alias <name> <profile>')
		.description('Point an alias launcher at a profile')
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
