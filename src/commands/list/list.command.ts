import { styleText } from 'node:util';

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

			const out = process.stdout;
			const outStyle = { stream: out };

			out.write(`${styleText('bold', 'Profiles:', outStyle)}\n\n`);

			// One blank line between profile blocks, so a long list reads as records, not one wall.
			// Fields sit one level under the profile name; labels are dim, the active name is bold.
			const blocks = result.entries.map((entry) => {
				const marker = entry.active ? styleText('green', '*', outStyle) : ' ';
				const name = entry.active ? styleText('bold', entry.name, outStyle) : entry.name;
				const tag = entry.rendered ? styleText('dim', ' [rendered]', outStyle) : '';

				const fields = profileFieldLines(entry.profile).map((line) => {
					const trimmed = line.trim();
					const at = trimmed.indexOf(':');

					if (at === -1) {
						return `      ${trimmed}`;
					}

					return `      ${styleText('dim', trimmed.slice(0, at + 1), outStyle)}${trimmed.slice(at + 1)}`;
				});

				return [`  ${marker} ${name}${tag}`, ...fields].join('\n');
			});

			if (blocks.length > 0) {
				out.write(`${blocks.join('\n\n')}\n`);
			}

			if (result.aliases.length > 0) {
				out.write(`\n${styleText('bold', 'Aliases:', outStyle)}\n\n`);

				for (const alias of result.aliases) {
					out.write(`  ${alias.name} ${styleText('dim', '→', outStyle)} ${alias.profile}\n`);
				}
			}
		});
};
