import { runConfig } from '@/commands/config/services/config.service';
import { artifactLines, showBinPathNotice } from '@/core/ui/artifact.ui';
import { profileFieldLines } from '@/core/ui/profile.ui';

import type { ConfigOptions } from '@/commands/config/services/config.service';
import type { Command } from 'commander';

export const registerConfigCommand = (program: Command): void => {
	program
		.command('config')
		.description('Create or update a profile')
		.option('--name, -n <name>', 'Profile name (default: "default")')
		.option('--url, -u <url>', 'API base URL')
		.option('--token, -t <token>', 'API token')
		.option('--oauth-token <token>', 'Claude Code login token (CLAUDE_CODE_OAUTH_TOKEN)')
		.option('--haiku <model>', 'Haiku model')
		.option('--sonnet, -s <model>', 'Sonnet model')
		.option('--opus, -o <model>', 'Opus model')
		.option('--fable, -f <model>', 'Fable model')
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
