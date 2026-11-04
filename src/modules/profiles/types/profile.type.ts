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

/** The parsed file shape: `profiles` is optional, so a file without it can be told apart. */
export type RawCsConfig = Omit<CsConfig, 'profiles'> & {
	profiles?: Record<string, Profile>;
};

export type ProfileUpdate = Partial<Profile>;
