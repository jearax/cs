import { describe, expect, test } from 'bun:test'

import { fetchRemoteModels, validateRemoteModelsResponse } from '../../src/services/opencode-models-sync'

describe('validateRemoteModelsResponse', () => {
	test('accepts minimum valid response shape', () => {
		expect(
			validateRemoteModelsResponse({
				data: [
					{
						capabilities: {
							family: 'family',
							limits: { max_context_window_tokens: 1, max_output_tokens: 1, max_prompt_tokens: 1 },
							supports: { streaming: true, tool_calls: true }
						},
						id: 'model',
						model_picker_enabled: true,
						name: 'Model',
						version: 'model'
					}
				]
			})?.data[0].id
		).toBe('model')
	})

	test('rejects invalid response shape', () => {
		expect(validateRemoteModelsResponse({ data: [{ id: 'missing-fields' }] })).toBeUndefined()
		expect(validateRemoteModelsResponse({})).toBeUndefined()
	})
})

describe('fetchRemoteModels', () => {
	test('sends bearer token and returns parsed models', async () => {
		let authHeader = ''
		const fetcher = async (_url: string | URL | Request, init?: RequestInit): Promise<Response> => {
			authHeader = String((init?.headers as Record<string, string>).Authorization)
			return new Response(
				JSON.stringify({
					data: [
						{
							capabilities: {
								family: 'family',
								limits: { max_context_window_tokens: 1, max_output_tokens: 1, max_prompt_tokens: 1 },
								supports: { streaming: true, tool_calls: true }
							},
							id: 'model',
							model_picker_enabled: true,
							name: 'Model',
							version: 'model'
						}
					]
				}),
				{ status: 200 }
			)
		}

		const result = await fetchRemoteModels('secret-key', { fetcher })

		expect(result.ok).toBe(true)
		expect(authHeader).toBe('Bearer secret-key')
		if (result.ok) {
			expect(result.response.data[0].id).toBe('model')
		}
	})

	test('does not include API key in failure reason', async () => {
		const fetcher = async (): Promise<Response> => new Response('nope', { status: 401, statusText: 'Unauthorized' })
		const result = await fetchRemoteModels('secret-key', { fetcher })

		expect(result.ok).toBe(false)
		if (!result.ok) {
			expect(result.reason).not.toContain('secret-key')
			expect(result.reason).toContain('401')
		}
	})
})
