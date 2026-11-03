export type Profile = {
	url: string;
	token: string;
	oauthToken?: string;

	haiku: string;
	sonnet: string;
	opus: string;
	fable: string;
	env?: Record<string, string>;
};

export type NamedProfile = Profile & {
	name: string;
};

export type CsConfig = {
	schemaVersion?: number;
	profiles: Record<string, Profile>;
	currentProfile?: string;
	env?: Record<string, string>;
	ownedClaudeSettingsKeys?: string[];
	/** A role alias and the profile its launcher points at. */
	aliases?: Record<string, string>;
};

/** The raw file shape: a config that predates the `profiles` key still carries `claude`. */
export type RawCsConfig = Omit<CsConfig, 'profiles'> & {
	profiles?: Record<string, Profile>;
	claude?: Record<string, Profile>;
};

export type ProfileUpdate = Partial<Profile>;
