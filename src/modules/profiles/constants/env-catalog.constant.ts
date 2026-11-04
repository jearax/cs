export type EnvCatalogEntry = {
	key: string;
	description: string;
	/** cs derives the value from the `[1m]` markers, so a set value overrides the derivation. */
	managedByCs?: boolean;
};

/**
 * Hand-curated from the official env-vars docs (code.claude.com/docs/en/env-vars); no fetching
 * at build time. The credential keys cs manages through profiles are never suggested.
 */
export const ENV_CATALOG: EnvCatalogEntry[] = [
	{
		key: 'ANTHROPIC_SMALL_FAST_MODEL',
		description: '[deprecated] Haiku-class model for background tasks'
	},
	{
		key: 'CLAUDE_CODE_AUTO_COMPACT_WINDOW',
		description: 'Context threshold that triggers auto-compaction',
		managedByCs: true
	},
	{
		key: 'CLAUDE_CODE_DISABLE_1M_CONTEXT',
		description: 'Disables the 1M context window when set to 1',
		managedByCs: true
	},
	{
		key: 'CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC',
		description: 'Disables auto-updates, telemetry and other nonessential network traffic'
	},
	{
		key: 'CLAUDE_CODE_MAX_OUTPUT_TOKENS',
		description: 'Maximum output tokens per request'
	},
	{
		key: 'CLAUDE_CODE_SUBAGENT_MODEL',
		description: 'Default model for subagents and agent-team teammates'
	},
	{
		key: 'DISABLE_AUTOUPDATER',
		description: 'Disables automatic background updates'
	},
	{
		key: 'DISABLE_ERROR_REPORTING',
		description: 'Opts out of error reporting'
	},
	{
		key: 'DISABLE_TELEMETRY',
		description: 'Opts out of telemetry'
	},
	{
		key: 'MAX_THINKING_TOKENS',
		description: 'Token budget for extended thinking'
	}
];
