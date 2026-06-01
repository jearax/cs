import { describe, expect, test } from 'bun:test'

import { mergeOpenCodeModels } from '../../src/config/opencode-config'
import { OpencodeModel } from '../../src/services/opencode-model-types'

const models: Record<string, OpencodeModel> = {
	'claude-sonnet-4.6': {
		id: 'claude-sonnet-4.6',
		name: 'Claude Sonnet 4.6',
		provider: { api: 'claude-sonnet-4.6' }
	}
}

describe('mergeOpenCodeModels', () => {
	test('replaces only provider cs models and preserves options', () => {
		const config = {
			provider: {
				cs: {
					name: '@jjuidev/cs',
					npm: '@ai-sdk/anthropic',
					options: { apiKey: 'keep', baseURL: 'https://example.test/v1' },
					models: { stale: {} }
				}
			}
		}

		mergeOpenCodeModels(config, models, '@jjuidev/cs')

		expect((config.provider.cs as Record<string, unknown>).options).toEqual({
			apiKey: 'keep',
			baseURL: 'https://example.test/v1'
		})
		expect((config.provider.cs as Record<string, unknown>).models).toEqual(models)
	})

	test('preserves unrelated providers and top-level keys', () => {
		const config = {
			model: 'other/model',
			provider: {
				other: { models: { other: {} } }
			}
		}

		mergeOpenCodeModels(config, models, '@jjuidev/cs')

		expect(config.model).toBe('other/model')
		expect(config.provider.other).toEqual({ models: { other: {} } })
		expect((config.provider.cs as Record<string, unknown>).models).toEqual(models)
	})

	test('does not write empty models', () => {
		const config = { provider: { cs: { models: { existing: {} } } } }

		expect(mergeOpenCodeModels(config, {}, '@jjuidev/cs')).toBe(false)
		expect(config.provider.cs.models).toEqual({ existing: {} })
	})
})
