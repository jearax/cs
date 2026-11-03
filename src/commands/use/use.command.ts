import { runUse } from '@/commands/use/services/use.service';
import { artifactLines, showBinPathNotice } from '@/core/ui/artifact.ui';
import { profileFieldLines } from '@/core/ui/profile.ui';

import type { Command } from 'commander';

export const registerUseCommand = (program: Command): void => {
	program
		.command('use <profile>')
		.description('Switch to a profile')
		.action(async (name: string) => {
			const result = await runUse(name);

			for (const notice of result.notices) {
				process.stderr.write(`   ! ${notice}\n`);
			}

			process.stdout.write(`Switched to profile "${result.name}".\n`);
			process.stdout.write(`${profileFieldLines(result.profile).join('\n')}\n`);
			process.stdout.write(`${artifactLines(result.artifacts).join('\n')}\n`);
			showBinPathNotice(result.binPath);
		});
};
