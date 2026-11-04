import { Option } from 'commander';

import { runConfig } from '@/commands/config/services/config.service';
import { artifactLines, showBinPathNotice } from '@/core/ui/artifact.ui';
import { profileFieldLines } from '@/core/ui/profile.ui';

import type { ConfigOptions } from '@/commands/config/services/config.service';
import type { Command } from 'commander';

const INHERITED_NOTE = 'inherited from the default profile on creation';

export const registerConfigCommand = (program: Command): void => {
	program
		.command('config')
		.description('Create or update a profile')
		.addOption(new Option('--name, -n <name>', 'Profile name').default('default'))
		.addOption(new Option('--url, -u <url>', 'API base URL').default(undefined, INHERITED_NOTE))
		.addOption(new Option('--token, -t <token>', 'API token').default(undefined, INHERITED_NOTE))
		.addOption(new Option('--oauth-token <token>', 'Claude Code login token (CLAUDE_CODE_OAUTH_TOKEN)'))
		.addOption(new Option('--haiku <model>', 'Haiku model').default(undefined, INHERITED_NOTE))
		.addOption(new Option('--sonnet, -s <model>', 'Sonnet model').default(undefined, INHERITED_NOTE))
		.addOption(new Option('--opus, -o <model>', 'Opus model').default(undefined, INHERITED_NOTE))
		.addOption(new Option('--fable, -f <model>', 'Fable model').default(undefined, INHERITED_NOTE))
		.addHelpText(
			'after',
			'\nExample: cs config -n claude -s claude-sonnet-4.7 stores claude-sonnet-4-7 (dot form converted); append [1m] for the 1M window.\n'
		)
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

			process.stdout.write(`Profile "${result.name}" updated.\n`);

			if (result.artifacts !== null) {
				process.stdout.write(`${artifactLines(result.artifacts).join('\n')}\n`);
			}

			showBinPathNotice(result.binPath);
		});
};
