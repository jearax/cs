export interface Profile {
	url: string
	token: string
	haiku: string
	sonnet: string
	opus: string
	fable: string
	env?: Record<string, string>
}

export interface ClaudeEnv {
	ANTHROPIC_AUTH_TOKEN?: string
	ANTHROPIC_BASE_URL?: string
	ANTHROPIC_DEFAULT_MODEL?: string
	ANTHROPIC_DEFAULT_HAIKU_MODEL?: string
	ANTHROPIC_DEFAULT_SONNET_MODEL?: string
	ANTHROPIC_DEFAULT_OPUS_MODEL?: string
	ANTHROPIC_DEFAULT_FABLE_MODEL?: string
	[key: string]: string | undefined
}

export interface ClaudeSettings {
	env?: ClaudeEnv
	disableClaudeAiConnectors?: boolean
	[key: string]: unknown
}
