import { runUse } from '@/commands/use/services/use.service';
import { artifactLines, showBinPathNotice } from '@/core/ui/artifact.ui';
import { examplesText } from '@/core/ui/help-examples.ui';
import { profileFieldLines } from '@/core/ui/profile.ui';

import type { Command } from 'commander';

const EXAMPLE_ROWS: ReadonlyArray<readonly [string, string]> = [
	['cs use work', 'Switch Claude Code to the work profile in every new session']
];

export const registerUseCommand = (program: Command): void => {
	program
		.command('use <profile>')
		.description('Switch to a profile')
		.addHelpText('after', examplesText(EXAMPLE_ROWS))
		.action(async (name: string) => {
			const result = await runUse(name);

			for (const notice of result.notices) {
				process.stderr.write(`   ! ${notice}\n`);
			}

			process.stdout.write(`Switched to profile "${result.name}".\n`);
			process.stdout.write(`${profileFieldLines(result.profile, '').join('\n')}\n`);
			process.stdout.write(`${artifactLines(result.artifacts, '').join('\n')}\n`);
			showBinPathNotice(result.binPath, '');
		});
};
