import { describe, expect, test } from 'bun:test'

import { getOpencodeConfigPathForPlatform } from '../../src/config/defaults'
import { getModelsCacheFromConfig, resolveCsApiKeyFromSources } from '../../src/config/cs-config'

describe('OpenCode config path resolution', () => {
	test('uses XDG-style path on macOS', () => {
		expect(getOpencodeConfigPathForPlatform('darwin', '/Users/example', {})).toBe(
			'/Users/example/.config/opencode/opencode.json'
		)
	})

	test('uses XDG-style path on Linux', () => {
		expect(getOpencodeConfigPathForPlatform('linux', '/home/example', {})).toBe(
			'/home/example/.config/opencode/opencode.json'
		)
	})

	test('uses APPDATA on Windows when available', () => {
		expect(
			getOpencodeConfigPathForPlatform('win32', 'C:/Users/example', {
				APPDATA: 'C:/Users/example/AppData/Roaming'
			})
		).toBe('C:/Users/example/AppData/Roaming/opencode/opencode.json')
	})

	test('falls back to home AppData/Roaming on Windows', () => {
		expect(getOpencodeConfigPathForPlatform('win32', 'C:/Users/example', {})).toBe(
			'C:/Users/example/AppData/Roaming/opencode/opencode.json'
		)
	})
})

describe('CS API key resolution', () => {
	test('prefers shell environment key over config key', () => {
		expect(resolveCsApiKeyFromSources('shell-key', 'config-key')).toBe('shell-key')
	})

	test('falls back to config key when shell key is empty', () => {
		expect(resolveCsApiKeyFromSources('   ', 'config-key')).toBe('config-key')
	})

	test('returns undefined when both keys are empty', () => {
		expect(resolveCsApiKeyFromSources('', '  ')).toBeUndefined()
	})
})

describe('models cache defaults', () => {
	test('returns empty models when config has no cache', () => {
		expect(getModelsCacheFromConfig({ claude: {}, opencode: {} })).toEqual({ models: {} })
	})

	test('returns empty models when cache has invalid models shape', () => {
		expect(getModelsCacheFromConfig({ claude: {}, opencode: {}, modelsCache: { models: [] } })).toEqual({
			models: {}
		})
	})
})
