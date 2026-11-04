import type { Profile } from '@/modules/profiles/types/profile.type';

/**
 * Schema version of `cs.json`: 1 is the baseline, no older shape is migrated — an old-shape file
 * is converted by hand (decision 0012).
 */
export const CURRENT_SCHEMA_VERSION = 1;

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
