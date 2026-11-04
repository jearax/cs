import { readFileSync } from 'node:fs';
import { access, chmod, readFile, rename } from 'node:fs/promises';

import { atomicWriteFile } from '@/core/utils/atomic-write.util';
import { maskToken } from '@/core/utils/mask-token.util';
import { csConfigPath } from '@/modules/profiles/constants/paths.constant';
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

export type LiveDefaultField = 'url' | 'token' | 'haiku' | 'sonnet' | 'opus' | 'fable';

/**
 * The synchronous read for help rendering only: a missing file or field yields undefined, so an
 * empty default never reaches a help line.
 */
export const readLiveDefault = (field: LiveDefaultField): string | undefined => {
	try {
		const raw = JSON.parse(readFileSync(csConfigPath(), 'utf8')) as RawCsConfig;
		const record = typeof raw.profiles === 'object' && raw.profiles !== null ? raw.profiles['default'] : undefined;
		const value = record?.[field];

		if (value === undefined || value === '') {
			return undefined;
		}

		// A help line must never carry a raw credential, even as a "default".
		return field === 'token' ? maskToken(value) : value;
	} catch {
		return undefined;
	}
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
	await atomicWriteFile(path, JSON.stringify(data, null, 2), CONFIG_FILE_MODE);
};

/** The key the profiles live under; a file without it is not a cs config. */
const readProfiles = (raw: RawCsConfig): Record<string, Profile> | undefined => {
	if (typeof raw.profiles === 'object' && raw.profiles !== null) {
		return raw.profiles;
	}

	return undefined;
};

/** Only the keys cs owns are carried over, so a key cs does not own never survives a rewrite. */
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

const fileExists = async (path: string): Promise<boolean> => {
	try {
		await access(path);

		return true;
	} catch {
		return false;
	}
};

/**
 * A file cs cannot use is moved aside, so its content stays available for a manual conversion. An
 * older backup is never silently replaced: the next one gets a numbered name.
 */
const keepUnreadableConfig = async (): Promise<string> => {
	let corruptPath = `${csConfigPath()}.corrupt`;
	let suffix = 0;

	while (await fileExists(corruptPath)) {
		suffix += 1;
		corruptPath = `${csConfigPath()}.corrupt.${suffix}`;
	}

	await rename(csConfigPath(), corruptPath);
	await chmod(corruptPath, CONFIG_FILE_MODE);

	return corruptPath;
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
		const corruptPath = await keepUnreadableConfig();

		const config = createInitialConfig();

		await saveCsConfig(config);

		return {
			config,
			notices: [
				`cs.json is not a cs config: it could not be parsed, or it has no \`profiles\` key. It was replaced by a default config and kept at ${corruptPath}`
			]
		};
	}

	// The stamp is always the baseline cs writes, so a stale higher number never survives a save.
	const config = toCsConfig(parsed, profiles, CURRENT_SCHEMA_VERSION);

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

/** The field order of a saved profile record; oauthToken and env are left out when unset. */
const canonicalProfile = (record: Profile): Profile => {
	return {
		url: record.url,
		token: record.token,
		...(record.oauthToken === undefined ? {} : { oauthToken: record.oauthToken }),
		haiku: record.haiku,
		sonnet: record.sonnet,
		opus: record.opus,
		fable: record.fable,
		...(record.env === undefined ? {} : { env: record.env })
	};
};

export const upsertProfile = (config: CsConfig, name: string, update: ProfileUpdate): Profile => {
	const existing = findProfile(config, name) ?? { ...EMPTY_PROFILE };

	const merged = canonicalProfile({
		...existing,
		...update
	});

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
