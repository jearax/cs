/** A claude profile stored in cs.json */
import { OpencodeModel } from '@/services/opencode-model-types'

export interface Profile {
	url: string
	token: string
	haiku: string
	sonnet: string
	opus: string
}

/** Cached OpenCode models derived from remote registry */
export interface ModelsCache {
	updatedAt?: string
	models: Record<string, OpencodeModel>
	rawCount?: number
	derivedCount?: number
}

/** Minimal third-party model — user-configured, not from remote registry */
export interface ThirdPartyModel {
	id: string
	name: string
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
