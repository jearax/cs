import { runCurrent } from '@/commands/current/services/current.service';
import { profileHeadingLines } from '@/core/ui/profile.ui';

import type { Command } from 'commander';

export const registerCurrentCommand = (program: Command): void => {
	program
		.command('current')
		.description('Show the active profile')
		.action(async () => {
			const result = await runCurrent();

			for (const notice of result.notices) {
				process.stderr.write(`   ! ${notice}\n`);
			}

			if (result.active === null) {
				process.stdout.write('No active profile detected.\n');
				process.stdout.write('   Run: cs use <profile>\n');
			} else {
				process.stdout.write(`${profileHeadingLines('Active', result.active.name, result.active).join('\n')}\n`);
			}

			if (result.rendered.length > 0) {
				process.stdout.write(`Rendered profiles: ${result.rendered.join(', ')}\n`);
			}
		});
};
