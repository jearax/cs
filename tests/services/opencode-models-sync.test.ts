import { describe, expect, test } from 'bun:test'

import { syncOpenCodeModelsFromRemote } from '../../src/services/opencode-models-sync'
import { RemoteModelsResponse } from '../../src/services/opencode-model-types'

const response: RemoteModelsResponse = {
	data: [
		{
			capabilities: {
				family: 'claude-sonnet-4.6',
				limits: { max_context_window_tokens: 1, max_output_tokens: 1, max_prompt_tokens: 1 },
				supports: { streaming: true, tool_calls: true }
			},
			id: 'claude-sonnet-4.6',
			model_picker_enabled: true,
			name: 'Claude Sonnet 4.6',
			version: 'claude-sonnet-4.6'
		}
	]
}

describe('syncOpenCodeModelsFromRemote', () => {
	test('writes OpenCode first, then saves cache on success', async () => {
		const calls: string[] = []
		const result = await syncOpenCodeModelsFromRemote({
			apiKey: 'key',
			fetchRemoteModels: async () => ({ ok: true, response, rawCount: 1 }),
			readOpenCodeConfig: () => ({ provider: { cs: { options: { apiKey: 'keep' } } } }),
			writeOpenCodeConfig: (config) => {
				calls.push(`write:${Object.keys(((config.provider as Record<string, unknown>).cs as Record<string, unknown>).models as object).length}`)
			},
			saveModelsCache: (cache) => {
				calls.push(`cache:${Object.keys(cache.models).length}`)
			},
			pkgName: '@jjuidev/cs'
		})

		expect(result.ok).toBe(true)
		expect(calls).toEqual(['write:1', 'cache:1'])
	})

	test('does not write or cache when derived models are empty', async () => {
		const calls: string[] = []
		const result = await syncOpenCodeModelsFromRemote({
			apiKey: 'key',
			fetchRemoteModels: async () => ({ ok: true, response: { data: [] }, rawCount: 0 }),
			readOpenCodeConfig: () => ({}),
			writeOpenCodeConfig: () => calls.push('write'),
			saveModelsCache: () => calls.push('cache'),
			pkgName: '@jjuidev/cs'
		})

		expect(result.ok).toBe(false)
		expect(calls).toEqual([])
	})
})
