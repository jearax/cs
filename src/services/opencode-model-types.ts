export type OpencodeModality = 'text' | 'audio' | 'image' | 'video' | 'pdf'

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
	vendor?: string
	family?: string
	release_date?: string
	attachment?: boolean
	reasoning?: boolean
	temperature?: boolean
	tool_call?: boolean
	limit?: OpencodeModelLimit
	modalities?: OpencodeModelModalities
	status?: string
	provider?: OpencodeModelProvider
	options?: Record<string, unknown>
	headers?: Record<string, string>
	variants?: Record<string, OpencodeModelVariant>
}

export interface RemoteVisionLimits {
	supported_media_types?: string[]
}

export interface RemoteModelLimits {
	max_context_window_tokens: number
	max_output_tokens: number
	max_prompt_tokens: number
	vision?: RemoteVisionLimits
}

export interface RemoteModelSupports {
	adaptive_thinking?: boolean
	max_thinking_budget?: number
	min_thinking_budget?: number
	reasoning_effort?: string[]
	streaming: boolean
	tool_calls: boolean
	vision?: boolean
}

export interface RemoteModelCapabilities {
	family: string
	limits: RemoteModelLimits
	supports: RemoteModelSupports
}

export interface RemoteModel {
	model_picker_enabled: boolean
	id: string
	name: string
	version: string
	vendor?: string
	supported_endpoints?: string[]
	policy?: { state?: string }
	capabilities: RemoteModelCapabilities
}

export interface RemoteModelsResponse {
	data: RemoteModel[]
}
