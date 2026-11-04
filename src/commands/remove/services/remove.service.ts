import { CliError } from '@/core/errors/cli.error';
import { validateProfileName } from '@/modules/profiles/checks/profile-name.check';
import { removeAliasLauncher } from '@/modules/profiles/services/alias-launcher.service';
import { removeProfileArtifacts } from '@/modules/profiles/services/artifact-cleanup.service';
import {
	findProfile,
	listAliases,
	loadCsConfig,
	removeAlias,
	removeProfile,
	saveCsConfig
} from '@/modules/profiles/services/storage.service';

export type RemoveResult = {
	name: string;
	cleanedAliases: string[];
	notices: string[];
};

export const runRemove = async (name: string): Promise<RemoveResult> => {
	const profileName = name.trim();
	const nameError = validateProfileName(profileName);

	if (nameError !== null) {
		throw new CliError(nameError);
	}

	if (profileName === 'default') {
		throw new CliError('Cannot remove the "default" profile.', {
			hint: 'Run: cs reset to restore it.'
		});
	}

	const { config, notices } = await loadCsConfig();

	if (findProfile(config, profileName) === undefined) {
		throw new CliError(`Profile "${profileName}" not found.`, {
			hint: 'List the profiles: cs list'
		});
	}

	removeProfile(config, profileName);

	// An alias that points at a removed profile is dangling: its launcher goes with it.
	const cleanedAliases = listAliases(config)
		.filter((alias) => {
			return alias.profile === profileName;
		})
		.map((alias) => {
			return alias.name;
		});

	for (const aliasName of cleanedAliases) {
		removeAlias(config, aliasName);
		await removeAliasLauncher(aliasName);
	}

	// The artifact goes before cs.json commits, so a failure never leaves an orphaned artifact.
	await removeProfileArtifacts(profileName);
	await saveCsConfig(config);

	return {
		name: profileName,
		cleanedAliases,
		notices
	};
};
