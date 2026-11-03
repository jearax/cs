export type ClaudeEnv = {
	ANTHROPIC_AUTH_TOKEN?: string;
	ANTHROPIC_BASE_URL?: string;
	ANTHROPIC_DEFAULT_MODEL?: string;
	ANTHROPIC_DEFAULT_HAIKU_MODEL?: string;
	ANTHROPIC_DEFAULT_SONNET_MODEL?: string;
	ANTHROPIC_DEFAULT_OPUS_MODEL?: string;
	ANTHROPIC_DEFAULT_FABLE_MODEL?: string;
	[key: string]: string | undefined;
};

export type ClaudeSettings = {
	env?: ClaudeEnv;
	disableClaudeAiConnectors?: boolean;
	[key: string]: unknown;
};

/** What the renderer always produces: the env block and the connector flag. */
export type RenderedSettings = {
	env: ClaudeEnv;
	disableClaudeAiConnectors: boolean;
};
