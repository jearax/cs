import { homedir } from 'node:os';
import { join } from 'node:path';

export const CS_DIR_SEGMENTS = ['.config', 'cs'] as const;

const homeDir = (): string => {
	return homedir();
};

export const csDir = (): string => {
	return join(homeDir(), ...CS_DIR_SEGMENTS);
};

export const csConfigPath = (): string => {
	return join(csDir(), 'cs.json');
};

export const csConfigBackupPath = (): string => {
	return join(csDir(), 'cs.json.bak');
};

export const profilesDir = (): string => {
	return join(csDir(), 'profiles');
};

export const binDir = (): string => {
	return join(csDir(), 'bin');
};

export const claudeSettingsPath = (): string => {
	return join(homeDir(), '.claude', 'settings.json');
};

export const profileArtifactPath = (profileName: string): string => {
	return join(profilesDir(), `${profileName}.json`);
};

export const launcherPath = (profileName: string): string => {
	return join(binDir(), `claude-${profileName}`);
};

/** The launcher points at the home-relative path, so it survives a different HOME. */
export const profileArtifactHomePath = (profileName: string): string => {
	return `~/.config/cs/profiles/${profileName}.json`;
};

export const binHomePath = (): string => {
	return '~/.config/cs/bin';
};
