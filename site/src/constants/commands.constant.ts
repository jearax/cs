/**
 * The nine commands, from `src/commands/` and the README's command table. The summary is the
 * command's own description; the details are what the command actually does.
 */
export type CommandInfo = {
	name: string;
	/** The docs page that explains the command. */
	slug: string;
	/** The command line the reader runs. */
	command: string;
	summary: string;
	details: string;
};

export const COMMANDS: readonly CommandInfo[] = [
	{
		name: 'config',
		slug: 'reference',
		command: 'cs config [options]',
		summary: 'Create or update a profile.',
		details:
			'No flags = show the profile. A new profile fills its unspecified fields from the default record, so a one-line create carries the model IDs. One token per profile: `token` and `oauthToken` are mutually exclusive, and `token` without `url` is rejected.'
	},
	{
		name: 'use',
		slug: 'reference',
		command: 'cs use work',
		summary: 'Activate a profile globally.',
		details:
			'Writes `~/.claude/settings.json` and makes the profile the active one. The same renderer also refreshes `~/.config/cs/profiles/<name>.json`, so both targets stay in step.'
	},
	{
		name: 'current',
		slug: 'reference',
		command: 'cs current',
		summary: 'Show the active profile.',
		details:
			'Prints the active profile and the profiles that have a rendered file, so a launcher always has an answer to "which profile am I on?"'
	},
	{
		name: 'list',
		slug: 'reference',
		command: 'cs list',
		summary: 'List all profiles.',
		details:
			'Default first, then the rest A to Z; aliases A→Z under their own heading. Marks each profile with [rendered] when a file exists under `~/.config/cs/profiles/`.'
	},
	{
		name: 'remove',
		slug: 'reference',
		command: 'cs remove work',
		summary: 'Delete a profile.',
		details: 'Answers to `rm`. `default` cannot be removed. Aliases that point at the profile are removed with it.'
	},
	{
		name: 'reset',
		slug: 'reference',
		command: 'cs reset',
		summary: 'Start over.',
		details:
			'Deletes every profile except `default` and restores its official values. The escape hatch when cs.json went somewhere you did not intend.'
	},
	{
		name: 'env',
		slug: 'reference',
		command: 'cs env',
		summary: 'Edit extra env vars.',
		details:
			'Interactive editor for extra environment variables, global or per-profile, that the renderer writes beside cs’s own keys in an explicit semantic order.'
	},
	{
		name: 'alias',
		slug: 'reference',
		command: 'cs alias <name> <profile>',
		summary: 'Create a launcher.',
		details:
			'Only aliases create launchers: `cs alias work work` writes `claude-work` into `~/.config/cs/bin`, a launcher that runs Claude Code with that profile’s rendered file. `cs alias remove <alias...>` deletes them.'
	}
];
