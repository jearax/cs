import { autocomplete, log, select, text } from '@clack/prompts';

import {
	applyEnvChange,
	buildUnsetKeyOptions,
	envDocsHintLine,
	ENV_KEY_PATTERN,
	listEnvProfiles,
	setKeyOptionsGetter
} from '@/commands/env/services/env.service';
import { CliError } from '@/core/errors/cli.error';
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
			// The prompts read stdin: without a terminal they would hang or read EOF as a cancel.
			if (process.stdin.isTTY !== true) {
				throw new CliError('cs env needs an interactive terminal.');
			}

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

			if (action === 'set') {
				log.info(envDocsHintLine());
			}

			const unsetOptions =
				action === 'unset' ? await buildUnsetKeyOptions(scope === 'profile' ? 'profile' : 'global', profileName) : [];

			if (action === 'unset' && unsetOptions.length === 0) {
				const target = scope === 'profile' ? `profile "${profileName ?? ''}"` : 'the global scope';

				process.stdout.write(`No env keys set in ${target}.\n`);

				return;
			}

			const key = await autocomplete({
				message: action === 'set' ? 'Env key:' : 'Env key to remove:',
				options: action === 'set' ? setKeyOptionsGetter : unsetOptions,
				completeOnTab: true,
				validate: (input) => {
					return typeof input === 'string' && ENV_KEY_PATTERN.test(input)
						? undefined
						: 'Invalid. Must match [A-Z][A-Z0-9_]*';
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

			showBinPathNotice(result.binPath, '');
		});
};
