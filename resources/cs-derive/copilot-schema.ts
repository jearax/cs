// 1:1 TS mirror of resources/opencode-src/packages/opencode/src/plugin/github-copilot/models.ts:4-45

export interface CopilotVisionLimits {
	max_prompt_image_size: number
	max_prompt_images: number
	supported_media_types: string[]
}

export interface CopilotLimits {
	max_context_window_tokens: number
	max_output_tokens: number
	max_prompt_tokens: number
	vision?: CopilotVisionLimits
}

export interface CopilotSupports {
	adaptive_thinking?: boolean
	max_thinking_budget?: number
	min_thinking_budget?: number
	reasoning_effort?: string[]
	streaming: boolean
	structured_outputs?: boolean
	tool_calls: boolean
	vision?: boolean
}

export interface CopilotCapabilities {
	family: string
	limits: CopilotLimits
	supports: CopilotSupports
}

export interface CopilotPolicy {
	state?: string
}

export interface CopilotModel {
	model_picker_enabled: boolean
	id: string
	name: string
	version: string
	supported_endpoints?: string[]
	policy?: CopilotPolicy
	capabilities: CopilotCapabilities
}

export interface CopilotModelsResponse {
	data: CopilotModel[]
}
