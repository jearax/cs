// 1:1 TS mirror of opencode.json user-config Model schema
// (resources/opencode-src/packages/opencode/src/config/provider.ts:5-69)

export type OpencodeModality = 'text' | 'audio' | 'image' | 'video' | 'pdf'

export interface OpencodeModelCost {
	input: number
	output: number
	cache_read?: number
	cache_write?: number
	context_over_200k?: {
		input: number
		output: number
		cache_read?: number
		cache_write?: number
	}
}

export interface OpencodeModelLimit {
	context: number
	input?: number
	output: number
}

export interface OpencodeModelModalities {
	input: OpencodeModality[]
	output: OpencodeModality[]
}

export interface OpencodeModelProvider {
	npm?: string
	api?: string
}

export interface OpencodeModelVariant {
	reasoningEffort?: string
	reasoningSummary?: string
	include?: string[]
	thinking?: { type: 'adaptive' | 'enabled'; display?: string; budgetTokens?: number }
	effort?: string
	disabled?: boolean
	[key: string]: unknown
}

export interface OpencodeModel {
	id?: string
	name?: string
	family?: string
	release_date?: string
	attachment?: boolean
	reasoning?: boolean
	temperature?: boolean
	tool_call?: boolean
	interleaved?: true | { field: 'reasoning_content' | 'reasoning_details' }
	cost?: OpencodeModelCost
	limit?: OpencodeModelLimit
	modalities?: OpencodeModelModalities
	experimental?: boolean
	status?: string
	provider?: OpencodeModelProvider
	options?: Record<string, unknown>
	headers?: Record<string, string>
	variants?: Record<string, OpencodeModelVariant>
}
