import { CliError } from '@/core/errors/cli.error';
import { removeAliasLauncher } from '@/modules/profiles/services/alias-launcher.service';
import { removeAllArtifacts } from '@/modules/profiles/services/artifact-cleanup.service';
import { writeProfileGlobally } from '@/modules/profiles/services/global-write.service';
import { renderProfileArtifacts } from '@/modules/profiles/services/render-artifacts.service';
import {
	findProfile,
	listAliases,
	loadCsConfig,
	resetProfiles,
	saveCsConfig
} from '@/modules/profiles/services/storage.service';

import type { Profile } from '@/modules/profiles/types/profile.type';

export type ResetResult = {
	removed: string[];
	cleaned: string[];
	cleanedAliases: string[];
	profile: Profile;
	notices: string[];
};

export const runReset = async (): Promise<ResetResult> => {
	const { config, notices } = await loadCsConfig();

	// The whole alias map goes: a reset leaves no role launcher behind.
	const cleanedAliases = listAliases(config).map((alias) => {
		return alias.name;
	});

	for (const aliasName of cleanedAliases) {
		await removeAliasLauncher(aliasName);
	}

	delete config.aliases;

	const removed = resetProfiles(config);
	const cleaned = await removeAllArtifacts();

	await saveCsConfig(config);

	const profile = findProfile(config, 'default');

	if (profile === undefined) {
		throw new CliError('Default profile not found after reset.');
	}

	await renderProfileArtifacts('default', profile, config.env ?? {}, {});
	await writeProfileGlobally(config, 'default', profile);

	return {
		removed,
		cleaned,
		cleanedAliases,
		profile,
		notices
	};
};
