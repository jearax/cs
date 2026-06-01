import { describe, expect, test } from 'bun:test'

import { filterModelsForDisplay, hasModelsCache, shouldPromptForEmptyCache } from '../../src/commands/ls/model-display'
import { ModelsCache } from '../../src/config/types'

describe('ls model display helpers', () => {
	const cache: ModelsCache = {
		models: {
			'claude-sonnet-4.6': { id: 'claude-sonnet-4.6', name: 'Claude Sonnet 4.6', vendor: 'Anthropic' },
			'gpt-5.5': { id: 'gpt-5.5', name: 'GPT 5.5', vendor: 'OpenAI' }
		}
	}

	test('filters output by vendor without mutating source models', () => {
		const filtered = filterModelsForDisplay(cache.models, 'anthropic')

		expect(Object.keys(filtered)).toEqual(['claude-sonnet-4.6'])
		expect(Object.keys(cache.models)).toEqual(['claude-sonnet-4.6', 'gpt-5.5'])
	})

	test('returns all models when vendor is not provided', () => {
		expect(Object.keys(filterModelsForDisplay(cache.models))).toEqual(['claude-sonnet-4.6', 'gpt-5.5'])
	})

	test('detects empty cache', () => {
		expect(hasModelsCache({ models: {} })).toBe(false)
		expect(hasModelsCache(cache)).toBe(true)
	})

	test('prompts only when cache is empty and terminal is interactive', () => {
		expect(shouldPromptForEmptyCache({ models: {} }, true)).toBe(true)
		expect(shouldPromptForEmptyCache({ models: {} }, false)).toBe(false)
		expect(shouldPromptForEmptyCache(cache, true)).toBe(false)
	})
})
