import { readdir, rm } from 'node:fs/promises';

import { isValidProfileName } from '@/modules/profiles/checks/profile-name.check';
import { profileArtifactPath, profilesDir } from '@/modules/profiles/constants/paths.constant';

const listDir = async (dir: string): Promise<string[]> => {
	try {
		return await readdir(dir);
	} catch {
		return [];
	}
};

/**
 * Only a valid profile name is ever touched, so nothing else in the folder can be lost.
 * A profile leaves only its artifact behind: launchers belong to the aliases registry.
 */
export const removeProfileArtifacts = async (profileName: string): Promise<void> => {
	if (!isValidProfileName(profileName)) {
		return;
	}

	await rm(profileArtifactPath(profileName), { force: true });
};

/** The names cs renders: the profile files in the artifacts dir. */
export const listArtifactProfiles = async (): Promise<string[]> => {
	const names: string[] = [];

	for (const entry of await listDir(profilesDir())) {
		if (!entry.endsWith('.json')) {
			continue;
		}

		const name = entry.slice(0, -'.json'.length);

		if (isValidProfileName(name)) {
			names.push(name);
		}
	}

	return names;
};

export const removeAllArtifacts = async (): Promise<string[]> => {
	const names = await listArtifactProfiles();

	for (const name of names) {
		await removeProfileArtifacts(name);
	}

	return names;
};
