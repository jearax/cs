import { select, text } from '@clack/prompts';

import { applyEnvChange, ENV_KEY_PATTERN, listEnvProfiles } from '@/commands/env/services/env.service';
import { showBinPathNotice } from '@/core/ui/artifact.ui';

import type { Command } from 'commander';

const isText = (value: unknown): value is string => {
	return typeof value === 'string';
};

export const registerEnvCommand = (program: Command): void => {
	program
		.command('env')
		.description('Configure env vars (global or per-profile)')
		.action(async () => {
			const scope = await select({
				message: 'Configure env for:',
				options: [
					{
						label: 'Global',
						value: 'global'
					},
					{
						label: 'Profile',
						value: 'profile'
					}
				]
			});

			if (!isText(scope)) {
				process.stdout.write('Aborted.\n');

				return;
			}

			let profileName: string | undefined;

			if (scope === 'profile') {
				const names = await listEnvProfiles();

				if (names.length === 0) {
					process.stdout.write('No profiles found. Create one with: cs config -n <name>\n');

					return;
				}

				const selected = await select({
					message: 'Select profile:',
					options: names.map((name) => {
						return {
							label: name,
							value: name
						};
					})
				});

				if (!isText(selected)) {
					process.stdout.write('Aborted.\n');

					return;
				}

				profileName = selected;
			}

			const action = await select({
				message: 'Action:',
				options: [
					{
						label: 'Set',
						value: 'set'
					},
					{
						label: 'Unset',
						value: 'unset'
					}
				]
			});

			if (!isText(action)) {
				process.stdout.write('Aborted.\n');

				return;
			}

			const key = await text({
				message: 'Env key:',
				validate: (input) => {
					return input !== undefined && ENV_KEY_PATTERN.test(input) ? undefined : 'Invalid. Must match [A-Z][A-Z0-9_]*';
				}
			});

			if (!isText(key)) {
				process.stdout.write('Aborted.\n');

				return;
			}

			let value: string | undefined;

			if (action === 'set') {
				const input = await text({ message: `Value for ${key}:` });

				if (!isText(input)) {
					process.stdout.write('Aborted.\n');

					return;
				}

				value = input;
			}

			const result = await applyEnvChange(
				scope === 'profile' ? 'profile' : 'global',
				profileName,
				action === 'set' ? 'set' : 'unset',
				key,
				value
			);

			for (const notice of result.notices) {
				process.stderr.write(`   ! ${notice}\n`);
			}

			if (result.action === 'set') {
				process.stdout.write(`Saved ${result.key} to ${result.target}.\n`);
			} else {
				process.stdout.write(`Removed ${result.key} from ${result.target}.\n`);
			}

			showBinPathNotice(result.binPath);
		});
};
