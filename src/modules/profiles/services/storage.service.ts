import { chmod, copyFile, mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

import { csConfigBackupPath, csConfigPath } from '@/modules/profiles/constants/paths.constant';
import { CURRENT_SCHEMA_VERSION, EMPTY_PROFILE, OFFICIAL_PROFILE } from '@/modules/profiles/constants/profile.constant';

import type {
	CsConfig,
	NamedProfile,
	Profile,
	ProfileUpdate,
	RawCsConfig
} from '@/modules/profiles/types/profile.type';

const CONFIG_FILE_MODE = 0o600;

export type CsConfigLoad = {
	config: CsConfig;
	notices: string[];
};

const parseJson = <T>(content: string): T | null => {
	try {
		return JSON.parse(content) as T;
	} catch {
		return null;
	}
};

const createInitialConfig = (): CsConfig => {
	return {
		schemaVersion: CURRENT_SCHEMA_VERSION,
		profiles: { default: { ...OFFICIAL_PROFILE } },
		currentProfile: 'default'
	};
};

const writeJsonFile = async (path: string, data: unknown): Promise<void> => {
	await mkdir(dirname(path), { recursive: true });
	await writeFile(path, JSON.stringify(data, null, 2), { mode: CONFIG_FILE_MODE });
	// The mode of writeFile only applies when the file is created, so it is enforced here.
	await chmod(path, CONFIG_FILE_MODE);
};

const isLegacyAutoEnvEntry = (key: string, value: string): boolean => {
	return key === 'CLAUDE_CODE_DISABLE_1M_CONTEXT' || (key === 'CLAUDE_CODE_AUTO_COMPACT_WINDOW' && value === '1000000');
};

/** The v3 key the profiles live under; a v2 file keeps them under `claude`. */
const readProfiles = (raw: RawCsConfig): Record<string, Profile> | undefined => {
	if (typeof raw.profiles === 'object' && raw.profiles !== null) {
		return raw.profiles;
	}

	if (typeof raw.claude === 'object' && raw.claude !== null) {
		return raw.claude;
	}

	return undefined;
};

/**
 * The v1 step: the `[1m]` auto-env that `cs config` used to persist is derived at render time.
 * A legacy auto-env left in `profile.env` would override the `[1m]` defaults of the render.
 */
const stripLegacyAutoEnv = (profiles: Record<string, Profile>): void => {
	for (const profile of Object.values(profiles)) {
		if (!profile.env) {
			continue;
		}

		const userEnv = Object.fromEntries(
			Object.entries(profile.env).filter(([key, value]) => {
				return !isLegacyAutoEnvEntry(key, value);
			})
		);

		if (Object.keys(userEnv).length > 0) {
			profile.env = userEnv;
		} else {
			delete profile.env;
		}
	}
};

/** Only the keys cs owns are carried over, so the old key never survives a migration. */
const toCsConfig = (raw: RawCsConfig, profiles: Record<string, Profile>, schemaVersion: number): CsConfig => {
	const config: CsConfig = {
		schemaVersion,
		profiles
	};

	if (raw.currentProfile !== undefined) {
		config.currentProfile = raw.currentProfile;
	}

	if (raw.env !== undefined) {
		config.env = raw.env;
	}

	if (raw.ownedClaudeSettingsKeys !== undefined) {
		config.ownedClaudeSettingsKeys = raw.ownedClaudeSettingsKeys;
	}

	if (raw.aliases !== undefined) {
		config.aliases = raw.aliases;
	}

	return config;
};

const backupCsConfig = async (): Promise<void> => {
	await copyFile(csConfigPath(), csConfigBackupPath());
	await chmod(csConfigBackupPath(), CONFIG_FILE_MODE);
};

const keepUnreadableConfig = async (): Promise<void> => {
	const corruptPath = `${csConfigPath()}.corrupt`;

	await rename(csConfigPath(), corruptPath);
	await chmod(corruptPath, CONFIG_FILE_MODE);
};

export const loadCsConfig = async (): Promise<CsConfigLoad> => {
	let content: string;

	try {
		content = await readFile(csConfigPath(), 'utf8');
	} catch {
		const config = createInitialConfig();

		await saveCsConfig(config);

		return {
			config,
			notices: []
		};
	}

	const parsed = parseJson<RawCsConfig>(content);
	const profiles = parsed === null ? undefined : readProfiles(parsed);

	if (parsed === null || profiles === undefined) {
		await keepUnreadableConfig();

		const config = createInitialConfig();

		await saveCsConfig(config);

		return {
			config,
			notices: [`cs.json could not be read; it was replaced by a default config and kept at ${csConfigPath()}.corrupt`]
		};
	}

	const version = parsed.schemaVersion ?? 1;

	if (version < 2) {
		stripLegacyAutoEnv(profiles);
	}

	const config = toCsConfig(parsed, profiles, Math.max(version, CURRENT_SCHEMA_VERSION));

	if (version >= CURRENT_SCHEMA_VERSION) {
		return {
			config,
			notices: []
		};
	}

	// The file is backed up before it is rewritten, so the old shape stays recoverable.
	await backupCsConfig();
	await saveCsConfig(config);

	return {
		config,
		notices: []
	};
};

export const saveCsConfig = async (config: CsConfig): Promise<void> => {
	await writeJsonFile(csConfigPath(), config);
};

/** An own-property lookup, so a profile named `toString` never resolves to a prototype member. */
export const findProfile = (config: CsConfig, name: string): Profile | undefined => {
	return Object.hasOwn(config.profiles, name) ? config.profiles[name] : undefined;
};

const writeProfile = (config: CsConfig, name: string, profile: Profile): void => {
	Object.defineProperty(config.profiles, name, {
		value: profile,
		enumerable: true,
		writable: true,
		configurable: true
	});
};

export const listProfiles = (config: CsConfig): NamedProfile[] => {
	return Object.entries(config.profiles).map(([name, profile]) => {
		return {
			name,
			...profile
		};
	});
};

export const getCurrentProfileName = (config: CsConfig): string | undefined => {
	const name = config.currentProfile;

	return name !== undefined && findProfile(config, name) !== undefined ? name : undefined;
};

export const upsertProfile = (config: CsConfig, name: string, update: ProfileUpdate): Profile => {
	const existing = findProfile(config, name) ?? { ...EMPTY_PROFILE };

	const merged: Profile = {
		...existing,
		...update
	};

	writeProfile(config, name, merged);

	return merged;
};

/** Reports false when the profile is missing or is the `default` profile. */
export const removeProfile = (config: CsConfig, name: string): boolean => {
	if (name === 'default' || findProfile(config, name) === undefined) {
		return false;
	}

	delete config.profiles[name];

	if (config.currentProfile === name) {
		delete config.currentProfile;
	}

	return true;
};

/** Keeps only the `default` profile, restored to the official values; reports the removed names. */
export const resetProfiles = (config: CsConfig): string[] => {
	const removed = Object.keys(config.profiles).filter((name) => {
		return name !== 'default';
	});

	config.profiles = { default: { ...OFFICIAL_PROFILE } };
	config.currentProfile = 'default';

	return removed;
};

export type AliasEntry = {
	name: string;
	profile: string;
};

export const listAliases = (config: CsConfig): AliasEntry[] => {
	return Object.entries(config.aliases ?? {}).map(([name, profile]) => {
		return {
			name,
			profile
		};
	});
};

/** An own-property lookup, so an alias named `toString` never resolves to a prototype member. */
export const findAliasTarget = (config: CsConfig, name: string): string | undefined => {
	const aliases = config.aliases;

	if (aliases === undefined || !Object.hasOwn(aliases, name)) {
		return undefined;
	}

	return aliases[name];
};

/** The alias map is the registry that owns the `claude-<alias>` launchers. */
export const setAlias = (config: CsConfig, name: string, profile: string): void => {
	const aliases = config.aliases ?? {};

	Object.defineProperty(aliases, name, {
		value: profile,
		enumerable: true,
		writable: true,
		configurable: true
	});

	config.aliases = aliases;
};

/** Drops the map entry; the launcher is removed by the alias service. */
export const removeAlias = (config: CsConfig, name: string): boolean => {
	const aliases = config.aliases;

	if (aliases === undefined || !Object.hasOwn(aliases, name)) {
		return false;
	}

	delete aliases[name];

	if (Object.keys(aliases).length === 0) {
		delete config.aliases;
	}

	return true;
};
