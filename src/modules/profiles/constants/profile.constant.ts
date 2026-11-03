import type { Profile } from '@/modules/profiles/types/profile.type';

/**
 * Schema history:
 * - 1 (implicit): `cs config` persisted the `[1m]` auto-env into every `profile.env`
 * - 2: the auto-env is derived at render time; `profile.env` holds only user-set values
 * - 3: the profiles live under `profiles`; a v2 file keeps them under `claude`
 */
export const CURRENT_SCHEMA_VERSION = 3;

export const CONNECTORS_SETTING_KEY = 'disableClaudeAiConnectors';

export const LAUNCHER_NAME_PREFIX = 'claude-';

/** The seed of the `default` profile; never merged into the profiles a user configures. */
export const OFFICIAL_PROFILE: Profile = {
	url: 'https://api.anthropic.com',
	token: '',
	haiku: 'claude-haiku-5-5[1m]',
	sonnet: 'claude-sonnet-5-5[1m]',
	opus: 'claude-opus-5-5[1m]',
	fable: 'claude-fable-5-1[1m]'
};

/** A profile created by `cs config` starts blank, so only the flags that are passed are set. */
export const EMPTY_PROFILE: Profile = {
	url: '',
	token: '',
	haiku: '',
	sonnet: '',
	opus: '',
	fable: ''
};
