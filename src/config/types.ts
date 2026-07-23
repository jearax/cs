/** A claude profile stored in cs.json */
export interface Profile {
	url: string
	token: string
	haiku: string
	sonnet: string
	opus: string
}

/** Typed env block for Claude settings.json — all optional, populated by merge */
export interface ClaudeEnv {
	ANTHROPIC_AUTH_TOKEN?: string
	ANTHROPIC_BASE_URL?: string
	ANTHROPIC_DEFAULT_HAIKU_MODEL?: string
	ANTHROPIC_DEFAULT_SONNET_MODEL?: string
	ANTHROPIC_DEFAULT_OPUS_MODEL?: string
	[key: string]: string | undefined
}

/** Claude settings.json top-level shape */
export interface ClaudeSettings {
	env?: ClaudeEnv
	[key: string]: unknown
}
