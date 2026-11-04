import { access, rm } from 'node:fs/promises';

import { atomicWriteFile } from '@/core/utils/atomic-write.util';
import { launcherPath, profileArtifactPath } from '@/modules/profiles/constants/paths.constant';
import { buildLauncherContent } from '@/modules/profiles/services/launcher.service';

const LAUNCHER_FILE_MODE = 0o755;

/** The launcher carries no secret: it names the artifact that holds the token. */
export const renderAliasLauncher = async (aliasName: string, targetProfileName: string): Promise<string> => {
	const path = launcherPath(aliasName);

	await atomicWriteFile(path, buildLauncherContent(targetProfileName), LAUNCHER_FILE_MODE);

	return path;
};

export const removeAliasLauncher = async (aliasName: string): Promise<void> => {
	await rm(launcherPath(aliasName), { force: true });
};

/** Every alias whose target is the given profile. */
export const aliasesForProfile = (aliases: Record<string, string>, profileName: string): string[] => {
	return Object.entries(aliases)
		.filter(([, target]) => {
			return target === profileName;
		})
		.map(([name]) => {
			return name;
		});
};

/**
 * Re-renders the launchers of every alias that targets the profile, so an alias never points
 * at an artifact cs has moved or rewritten.
 */
export const renderAliasLaunchers = async (aliases: Record<string, string>, profileName: string): Promise<string[]> => {
	const names = aliasesForProfile(aliases, profileName);

	for (const name of names) {
		await renderAliasLauncher(name, profileName);
	}

	return names;
};

/** The launcher points at a rendered artifact, so the target must have one. */
export const profileArtifactExists = async (profileName: string): Promise<boolean> => {
	try {
		await access(profileArtifactPath(profileName));

		return true;
	} catch {
		return false;
	}
};
