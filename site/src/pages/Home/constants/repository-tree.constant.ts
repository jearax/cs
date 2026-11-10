// What a real smoke run of `cs config` + `cs use` + `cs alias` leaves on disk, under the home
// directory. The store, the rendered profiles, the launchers, and the global settings cs writes.
export type TreeNode = {
	name: string;
	children?: readonly TreeNode[];
};

export const REPOSITORY_TREE: readonly TreeNode[] = [
	{
		name: '~/.config/cs',
		children: [
			{ name: 'cs.json' },
			{
				name: 'bin',
				children: [{ name: 'claude-work' }]
			},
			{
				name: 'profiles',
				children: [{ name: 'default.json' }, { name: 'work.json' }]
			}
		]
	},
	{
		name: '~/.claude',
		children: [{ name: 'settings.json' }]
	}
];

export type HarnessPoint = {
	title: string;
	text: string;
};

export const HARNESS_POINTS: readonly HarnessPoint[] = [
	{
		title: 'The store',
		text: 'One cs.json at mode 0600: every profile, the active one, the aliases.'
	},
	{
		title: 'The rendered files',
		text: 'A settings-shaped artifact per profile, refreshed by the same renderer cs use runs.'
	},
	{
		title: 'The launchers',
		text: 'claude-<name> commands, one per alias, each pinned to one profile.'
	}
];
