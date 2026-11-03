import { chmod, mkdir, writeFile } from 'node:fs/promises';

import {
	binDir,
	binHomePath,
	launcherPath,
	profileArtifactHomePath,
	profileArtifactPath,
	profilesDir
} from '@/modules/profiles/constants/paths.constant';
import { renderAliasLaunchers } from '@/modules/profiles/services/alias-launcher.service';
import { buildLauncherContent, buildLauncherName } from '@/modules/profiles/services/launcher.service';
import { renderProfileSettings } from '@/modules/profiles/services/render.service';

import type { Profile } from '@/modules/profiles/types/profile.type';

const ARTIFACT_FILE_MODE = 0o600;
const LAUNCHER_FILE_MODE = 0o755;

export type ProfileArtifacts = {
	settingsPath: string;
	settingsHomePath: string;
	launcherPath: string;
	launcherHomePath: string;
	launcherName: string;
	launchCommand: string;
};

/** The artifact target: a settings-shaped file plus the launcher that points at it. */
export const renderProfileArtifacts = async (
	profileName: string,
	profile: Profile,
	globalEnv: Record<string, string>,
	aliases: Record<string, string> = {}
): Promise<ProfileArtifacts> => {
	const rendered = renderProfileSettings({
		profile,
		globalEnv
	});

	const artifactPath = profileArtifactPath(profileName);
	const scriptPath = launcherPath(profileName);

	await mkdir(profilesDir(), { recursive: true });
	await writeFile(artifactPath, JSON.stringify(rendered, null, 2), { mode: ARTIFACT_FILE_MODE });
	await chmod(artifactPath, ARTIFACT_FILE_MODE);

	await mkdir(binDir(), { recursive: true });
	await writeFile(scriptPath, buildLauncherContent(profileName), { mode: LAUNCHER_FILE_MODE });
	await chmod(scriptPath, LAUNCHER_FILE_MODE);

	// Every alias that points at this profile is re-rendered with it.
	await renderAliasLaunchers(aliases, profileName);

	return {
		settingsPath: artifactPath,
		settingsHomePath: profileArtifactHomePath(profileName),
		launcherPath: scriptPath,
		launcherHomePath: `${binHomePath()}/${buildLauncherName(profileName)}`,
		launcherName: buildLauncherName(profileName),
		launchCommand: `claude --settings ${profileArtifactHomePath(profileName)}`
	};
};
