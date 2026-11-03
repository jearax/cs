import { profileArtifactHomePath } from '@/modules/profiles/constants/paths.constant';
import { LAUNCHER_NAME_PREFIX } from '@/modules/profiles/constants/profile.constant';

export const buildLauncherName = (profileName: string): string => {
	return `${LAUNCHER_NAME_PREFIX}${profileName}`;
};

/** The launcher carries no secret: it names the artifact that holds the token. */
export const buildLauncherContent = (profileName: string): string => {
	return `#!/bin/sh\nexec claude --settings ${profileArtifactHomePath(profileName)}\n`;
};
