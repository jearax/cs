import { CliError } from '@/core/errors/cli.error';
import { validateProfileName } from '@/modules/profiles/checks/profile-name.check';
import { launcherPath } from '@/modules/profiles/constants/paths.constant';
import { removeAliasLauncher } from '@/modules/profiles/services/alias-launcher.service';
import { findAliasTarget, loadCsConfig, removeAlias, saveCsConfig } from '@/modules/profiles/services/storage.service';

export type AliasRemoveEntry = {
	name: string;
	profile: string;
	launcherPath: string;
};

export type AliasRemoveResult = {
	removed: AliasRemoveEntry[];
	notices: string[];
};

export const runAliasRemove = async (names: string[]): Promise<AliasRemoveResult> => {
	const aliasNames = [
		...new Set(
			names.map((name) => {
				return name.trim();
			})
		)
	];

	for (const aliasName of aliasNames) {
		const nameError = validateProfileName(aliasName, 'Alias');

		if (nameError !== null) {
			throw new CliError(nameError);
		}
	}

	const { config, notices } = await loadCsConfig();

	const targets = new Map<string, string>();

	for (const aliasName of aliasNames) {
		const profile = findAliasTarget(config, aliasName);

		if (profile === undefined) {
			throw new CliError(`Alias "${aliasName}" not found.`, {
				hint: 'List the aliases: cs list'
			});
		}

		targets.set(aliasName, profile);
	}

	const removed: AliasRemoveEntry[] = [];

	for (const [aliasName, profile] of targets) {
		removeAlias(config, aliasName);

		// The launcher goes before cs.json commits, so a failure never leaves an orphaned launcher.
		await removeAliasLauncher(aliasName);

		removed.push({
			name: aliasName,
			profile,
			launcherPath: launcherPath(aliasName)
		});
	}

	await saveCsConfig(config);

	return {
		removed,
		notices
	};
};
