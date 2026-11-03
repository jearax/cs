import { readdir, rm } from 'node:fs/promises';

import { isValidProfileName } from '@/modules/profiles/checks/profile-name.check';
import { binDir, launcherPath, profileArtifactPath, profilesDir } from '@/modules/profiles/constants/paths.constant';
import { LAUNCHER_NAME_PREFIX } from '@/modules/profiles/constants/profile.constant';

const listDir = async (dir: string): Promise<string[]> => {
	try {
		return await readdir(dir);
	} catch {
		return [];
	}
};

/** Only a valid profile name is ever touched, so nothing else in the folders can be lost. */
export const removeProfileArtifacts = async (profileName: string): Promise<void> => {
	if (!isValidProfileName(profileName)) {
		return;
	}

	await rm(profileArtifactPath(profileName), { force: true });
	await rm(launcherPath(profileName), { force: true });
};

/** The names cs owns: the profile files and the `claude-<profile>` launchers. */
export const listArtifactProfiles = async (): Promise<string[]> => {
	const names = new Set<string>();

	for (const entry of await listDir(profilesDir())) {
		if (!entry.endsWith('.json')) {
			continue;
		}

		const name = entry.slice(0, -'.json'.length);

		if (isValidProfileName(name)) {
			names.add(name);
		}
	}

	for (const entry of await listDir(binDir())) {
		if (!entry.startsWith(LAUNCHER_NAME_PREFIX)) {
			continue;
		}

		const name = entry.slice(LAUNCHER_NAME_PREFIX.length);

		if (isValidProfileName(name)) {
			names.add(name);
		}
	}

	return [...names];
};

export const removeAllArtifacts = async (): Promise<string[]> => {
	const names = await listArtifactProfiles();

	for (const name of names) {
		await removeProfileArtifacts(name);
	}

	return names;
};
