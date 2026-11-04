export type EnvCatalogEntry = {
	key: string;
	description: string;
	/** cs derives the value from the `[1m]` markers, so a set value overrides the derivation. */
	managedByCs?: boolean;
};

/** The docs the catalog is curated from; printed as a reference in the SET flow. */
export const ENV_DOCS_URL = 'https://code.claude.com/docs/en/env-vars';

/**
 * Only the keys cs itself interacts with: the pair it derives from the `[1m]` markers. Everything
 * else is a pass-through — the docs reference in the SET flow covers it. Hand-curated, no
 * fetching at build time; the credential keys cs manages through profiles are never suggested.
 */
export const ENV_CATALOG: EnvCatalogEntry[] = [
	{
		key: 'CLAUDE_CODE_AUTO_COMPACT_WINDOW',
		description: 'Context threshold that triggers auto-compaction',
		managedByCs: true
	},
	{
		key: 'CLAUDE_CODE_DISABLE_1M_CONTEXT',
		description: 'Disables the 1M context window when set to 1',
		managedByCs: true
	}
];
