import { runList } from '@/commands/list/services/list.service';
import { profileFieldLines } from '@/core/ui/profile.ui';

import type { Command } from 'commander';

export const registerListCommand = (program: Command): void => {
	program
		.command('list')
		.alias('ls')
		.description('List all profiles')
		.action(async () => {
			const result = await runList();

			for (const notice of result.notices) {
				process.stderr.write(`   ! ${notice}\n`);
			}

			process.stdout.write('Profiles:\n\n');

			// One blank line between profile blocks, so a long list reads as records, not one wall.
			const blocks = result.entries.map((entry) => {
				const marker = entry.active ? '*' : ' ';
				const tag = entry.rendered ? ' [rendered]' : '';

				const fields = profileFieldLines(entry.profile).map((line) => {
					return `    ${line.trim()}`;
				});

				return [`  ${marker} ${entry.name}${tag}`, ...fields].join('\n');
			});

			if (blocks.length > 0) {
				process.stdout.write(`${blocks.join('\n\n')}\n`);
			}

			if (result.aliases.length > 0) {
				process.stdout.write('\nAliases:\n\n');

				for (const alias of result.aliases) {
					process.stdout.write(`  ${alias.name} → ${alias.profile}\n`);
				}
			}
		});
};
