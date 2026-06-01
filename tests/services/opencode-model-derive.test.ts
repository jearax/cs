import { describe, expect, test } from 'bun:test'

import { deriveModels } from '../../src/services/opencode-model-derive'
import { RemoteModelsResponse } from '../../src/services/opencode-model-types'

const anthropicModel = {
	capabilities: {
		family: 'claude-sonnet-4.6',
		limits: {
			max_context_window_tokens: 200000,
			max_output_tokens: 32000,
			max_prompt_tokens: 128000,
			vision: { supported_media_types: ['image/png'] }
		},
		supports: {
			adaptive_thinking: true,
			reasoning_effort: ['low', 'medium', 'high'],
			streaming: true,
			tool_calls: true,
			vision: true
		}
	},
	id: 'claude-sonnet-4.6',
	model_picker_enabled: true,
	name: 'Claude Sonnet 4.6',
	policy: { state: 'enabled' },
	supported_endpoints: ['/v1/messages'],
	vendor: 'Anthropic',
	version: 'claude-sonnet-4.6'
}

const response = { data: [anthropicModel] } satisfies RemoteModelsResponse

describe('deriveModels', () => {
	test('derives OpenCode config model shape', () => {
		const models = deriveModels(response)
		const model = models['claude-sonnet-4.6']

		expect(model.name).toBe('Claude Sonnet 4.6')
		expect(model.limit?.context).toBe(200000)
		expect(model.modalities?.input).toContain('image')
		expect(model.provider?.npm).toBe('@ai-sdk/anthropic')
		expect(model.provider?.api).toBe('claude-sonnet-4.6')
		expect(Object.keys(model.variants ?? {})).toEqual(['low', 'medium', 'high'])
	})

	test('excludes disabled and picker-disabled models', () => {
		const models = deriveModels({
			data: [
				anthropicModel,
				{ ...anthropicModel, id: 'disabled-model', model_picker_enabled: false },
				{ ...anthropicModel, id: 'policy-disabled', policy: { state: 'disabled' } }
			]
		})

		expect(Object.keys(models)).toEqual(['claude-sonnet-4.6'])
	})

	test('preserves existing display metadata', () => {
		const models = deriveModels(response, {
			'claude-sonnet-4.6': {
				name: 'Custom Name',
				provider: { api: 'claude-sonnet-4.6' },
				options: { custom: true }
			}
		})

		expect(models['claude-sonnet-4.6'].name).toBe('Custom Name')
		expect(models['claude-sonnet-4.6'].options).toEqual({ custom: true })
	})
})
