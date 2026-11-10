export type ConfigOption = {
	flag: string;
	meaning: string;
};

/**
 * The `cs config` options, from `cs config --help`.
 */
export const CONFIG_OPTIONS: readonly ConfigOption[] = [
	{
		flag: '--name, -n <name>',
		meaning: 'The profile name. Defaults to `default`.'
	},
	{
		flag: '--url, -u <url>',
		meaning: 'The API base URL. Defaults to `https://api.anthropic.com`.'
	},
	{
		flag: '--token, -t <token>',
		meaning: 'The API token, for a paid-API profile. Mutually exclusive with `--oauth-token`; needs `--url`.'
	},
	{
		flag: '--oauth-token <token>',
		meaning: 'The Claude Code login token, for an oauth profile. Mutually exclusive with `--token`.'
	},
	{
		flag: '--haiku <model>',
		meaning: 'The Haiku model ID.'
	},
	{
		flag: '--sonnet, -s <model>',
		meaning: 'The Sonnet model ID.'
	},
	{
		flag: '--opus, -o <model>',
		meaning: 'The Opus model ID.'
	},
	{
		flag: '--fable, -f <model>',
		meaning: 'The Fable model ID.'
	}
];

export type ExitCode = {
	code: string;
	meaning: string;
	also?: {
		command: string;
		meaning: string;
	};
};

/**
 * The exit codes, from the README and the CLI's behaviour.
 */
export const EXIT_CODES: readonly ExitCode[] = [
	{
		code: '0',
		meaning: 'The command succeeded.'
	},
	{
		code: '1',
		meaning: 'The command failed, including an unknown command or an invalid profile.'
	}
];

export type Artifact = {
	label: string;
	value: string;
	what: string;
};

/**
 * What `cs use` leaves on disk, from a real smoke run against a temp HOME.
 */
export const ARTIFACTS: readonly Artifact[] = [
	{
		label: 'The store',
		value: '~/.config/cs/cs.json',
		what: 'Every profile, the active one, and the aliases. Mode 0600.'
	},
	{
		label: 'The rendered file',
		value: '~/.config/cs/profiles/<name>.json',
		what: 'A settings-shaped artifact per profile; the launcher path loads it for one session.'
	},
	{
		label: 'The global settings',
		value: '~/.claude/settings.json',
		what: 'What `cs use` writes for the whole machine.'
	},
	{
		label: 'The launchers',
		value: '~/.config/cs/bin/claude-<alias>',
		what: 'Only `cs alias` creates them.'
	}
];
