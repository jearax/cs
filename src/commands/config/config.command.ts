import { Option } from 'commander';

import { runConfig } from '@/commands/config/services/config.service';
import { artifactLines, showBinPathNotice } from '@/core/ui/artifact.ui';
import { examplesText } from '@/core/ui/help-examples.ui';
import { profileFieldLines } from '@/core/ui/profile.ui';

import type { ConfigOptions } from '@/commands/config/services/config.service';
import type { LiveDefaultField } from '@/modules/profiles/services/storage.service';
import type { Command } from 'commander';

const EXAMPLE_ROWS: ReadonlyArray<readonly [string, string]> = [
	['cs config -n planner -t <key>', 'Create planner: URL and models copied from the default record'],
	['cs config -n planner', 'Show planner, creating it with the default record when missing'],
	['cs config -n work -s claude-sonnet-5-5', 'Sonnet model; add [1m] if the model supports it and you need it']
];

/** The help renders this field's live value from the current default record as `(default: ...)`. */
const liveOption = (flags: string, description: string, field: LiveDefaultField): Option => {
	const option = new Option(flags, description);

	(option as Option & { csLiveDefault: LiveDefaultField }).csLiveDefault = field;

	return option;
};

export const registerConfigCommand = (program: Command): void => {
	program
		.command('config')
		.description('Create or update a profile')
		.addOption(new Option('--name, -n <name>', 'Profile name').default('default'))
		.addOption(liveOption('--url, -u <url>', 'API base URL', 'url'))
		.addOption(liveOption('--token, -t <token>', 'API token', 'token'))
		.addOption(new Option('--oauth-token <token>', 'Claude Code login token'))
		.addOption(liveOption('--haiku <model>', 'Haiku model', 'haiku'))
		.addOption(liveOption('--sonnet, -s <model>', 'Sonnet model', 'sonnet'))
		.addOption(liveOption('--opus, -o <model>', 'Opus model', 'opus'))
		.addOption(liveOption('--fable, -f <model>', 'Fable model', 'fable'))
		.addHelpText('after', examplesText(EXAMPLE_ROWS))
		.action(async (options: ConfigOptions) => {
			const result = await runConfig(options);

			for (const notice of result.notices) {
				process.stderr.write(`   ! ${notice}\n`);
			}

			if (result.kind === 'shown') {
				process.stdout.write(`Profile: ${result.name}\n`);
				process.stdout.write(`${profileFieldLines(result.profile).join('\n')}\n`);

				return;
			}

			if (result.kind === 'created') {
				const source = result.inherited ? ' with the "default" record' : '';

				process.stdout.write(`Profile "${result.name}" created${source}.\n`);
				process.stdout.write(`Profile: ${result.name}\n`);
				process.stdout.write(`${profileFieldLines(result.profile).join('\n')}\n`);

				if (result.artifacts !== null) {
					process.stdout.write(`${artifactLines(result.artifacts).join('\n')}\n`);
				}

				showBinPathNotice(result.binPath);

				return;
			}

			process.stdout.write(`Profile "${result.name}" updated.\n`);

			if (result.artifacts !== null) {
				process.stdout.write(`${artifactLines(result.artifacts, '').join('\n')}\n`);
			}

			showBinPathNotice(result.binPath, '');
		});
};
