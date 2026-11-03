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

			for (const entry of result.entries) {
				const marker = entry.active ? '*' : ' ';
				const tag = entry.rendered ? ' [rendered]' : '';

				process.stdout.write(`  ${marker} ${entry.name}${tag}\n`);

				const fields = profileFieldLines(entry.profile).map((line) => {
					return `    ${line.trim()}`;
				});

				process.stdout.write(`${fields.join('\n')}\n`);
			}

			if (result.aliases.length > 0) {
				process.stdout.write('\nAliases:\n\n');

				for (const alias of result.aliases) {
					process.stdout.write(`  ${alias.name} → ${alias.profile}\n`);
				}
			}
		});
};
