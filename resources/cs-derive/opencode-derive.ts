// Port of resources/opencode-src/packages/opencode/src/plugin/github-copilot/models.ts
// - build()  (lines 50-155) — flag derivation logic preserved 1:1
// - get()    (lines 157-194) — fetch removed; raw response passed in
//
// OUTPUT shape follows opencode.json config Model schema
// (resources/opencode-src/packages/opencode/src/config/provider.ts:5-69),
// NOT the SDK runtime Model. opencode internally maps config → runtime via
// provider.ts:1097-1110 (modalities.input.includes('image') -> capabilities.input.image, etc.)

import { CopilotModel, CopilotModelsResponse } from './copilot-schema'
import { OpencodeModality, OpencodeModel, OpencodeModelVariant } from './opencode-schema'

export const deriveModel = (key: string, remote: CopilotModel, prev?: OpencodeModel): OpencodeModel => {
	const reasoning =
		!!remote.capabilities.supports.adaptive_thinking ||
		!!remote.capabilities.supports.reasoning_effort?.length ||
		remote.capabilities.supports.max_thinking_budget !== undefined ||
		remote.capabilities.supports.min_thinking_budget !== undefined

	const image =
		(remote.capabilities.supports.vision ?? false) ||
		(remote.capabilities.limits.vision?.supported_media_types ?? []).some((item) => item.startsWith('image/'))

	const isMsgApi = remote.supported_endpoints?.includes('/v1/messages')

	const input: OpencodeModality[] = ['text']

	if (image) {
		input.push('image')
	}

	const model: OpencodeModel = {
		id: key,
		name: prev?.name ?? remote.name,
		family: prev?.family ?? remote.capabilities.family,
		release_date:
			prev?.release_date ??
			(remote.version.startsWith(`${remote.id}-`) ? remote.version.slice(remote.id.length + 1) : remote.version),
		attachment: prev?.attachment ?? true,
		reasoning: prev?.reasoning ?? reasoning,
		temperature: prev?.temperature ?? true,
		tool_call: remote.capabilities.supports.tool_calls,
		status: 'active',
		limit: {
			context: remote.capabilities.limits.max_context_window_tokens,
			input: remote.capabilities.limits.max_prompt_tokens,
			output: remote.capabilities.limits.max_output_tokens
		},
		modalities: {
			input,
			output: ['text']
		},
		provider: {
			npm: isMsgApi ? '@ai-sdk/anthropic' : '@ai-sdk/github-copilot',
			api: remote.id
		},
		options: prev?.options ?? {},
		headers: prev?.headers ?? {}
	}

	const efforts = remote.capabilities.supports.reasoning_effort
	const variants: Record<string, OpencodeModelVariant> = {}

	if (!isMsgApi && efforts?.length) {
		efforts.forEach((effort) => {
			variants[effort] = {
				reasoningEffort: effort,
				reasoningSummary: 'auto',
				include: ['reasoning.encrypted_content']
			}
		})
	} else if (efforts?.length && remote.capabilities.supports.adaptive_thinking) {
		efforts.forEach((effort) => {
			variants[effort] = {
				thinking: {
					type: 'adaptive',
					...(remote.id.includes('opus-4.7') ? { display: 'summarized' } : {})
				},
				effort
			}
		})
	} else if (remote.capabilities.supports.max_thinking_budget) {
		const max = remote.capabilities.supports.max_thinking_budget

		variants['max'] = {
			thinking: {
				type: 'enabled',
				budgetTokens: max - 1
			}
		}
		variants['high'] = {
			thinking: {
				type: 'enabled',
				budgetTokens: Math.floor(max / 2)
			}
		}
	}

	if (Object.keys(variants).length > 0) {
		model.variants = variants
	}

	return model
}

export const deriveModels = (
	response: CopilotModelsResponse,
	existing: Record<string, OpencodeModel> = {}
): Record<string, OpencodeModel> => {
	const result = { ...existing }

	const remote = new Map(
		response.data.filter((m) => m.model_picker_enabled && m.policy?.state !== 'disabled').map((m) => [m.id, m] as const)
	)

	// prune existing models whose provider.api isn't in the endpoint response
	for (const [key, model] of Object.entries(result)) {
		const apiId = model.provider?.api ?? model.id ?? key
		const m = remote.get(apiId)

		if (!m) {
			delete result[key]
			continue
		}

		result[key] = deriveModel(key, m, model)
	}

	// add new endpoint models not already keyed in result
	for (const [id, m] of remote) {
		if (id in result) {
			continue
		}

		result[id] = deriveModel(id, m)
	}

	return result
}
