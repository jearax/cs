import { confirm } from '@clack/prompts'
import { defineCommand } from 'citty'

import { filterModelsForDisplay, getModelsCacheCount, hasModelsCache, shouldPromptForEmptyCache } from './model-display'
import {
	getAllProfiles,
	getModelsCache,
	getThirdPartyModels,
	resolveCsApiKey,
	saveModelsCache
} from '@/config/cs-config'
import { readOpenCodeConfig, writeOpenCodeConfig } from '@/config/opencode-config'
import { ModelsCache } from '@/config/types'
import { syncOpenCodeModelsFromRemote } from '@/services/opencode-models-sync'
import { getActiveProfile } from '@/utils/active-profile'
import { displayBanner } from '@/utils/banner'
import { maskToken } from '@/utils/format'
import { logger } from '@/utils/logger'

import { name as pkgName } from '@/../package.json'

const renderModels = (cache: ModelsCache, vendor?: string): void => {
	const models = filterModelsForDisplay(cache.models, vendor)
	const count = Object.keys(models).length

	logger.text('Models:\n')
	logger.muted(`  Cache: ${getModelsCacheCount(cache)} models${cache.updatedAt ? `, updated ${cache.updatedAt}` : ''}`)

	if (vendor) {
		logger.muted(`  Vendor filter: ${vendor}`)
	}

	if (count === 0) {
		logger.warn('No models to display.')
		return
	}

	// Group by vendor, sort groups and models alphabetically
	const groups = new Map<string, [string, (typeof models)[string]][]>()

	for (const [id, model] of Object.entries(models)) {
		const vendor = model.vendor || 'Other'
		const list = groups.get(vendor) ?? []

		list.push([id, model])
		groups.set(vendor, list)
	}

	for (const [vendor, list] of [...groups].sort(([a], [b]) => a.localeCompare(b))) {
		logger.muted(`  [${vendor}]`)
		list.sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))

		for (const [id, model] of list) {
			logger.log(`    ${id}${model.name ? ` - ${model.name}` : ''}`)
		}
	}
}

const runModelsSync = async (): Promise<ModelsCache | undefined> => {
	const apiKey = resolveCsApiKey()

	if (!apiKey) {
		logger.warn('Models sync skipped: CS_API_KEY is not configured.')
		logger.muted('Set shell env CS_API_KEY or cs.json env.CS_API_KEY.')
		return undefined
	}

	// Collect third-party model IDs to preserve during derive
	const thirdPartyModels = getThirdPartyModels()
	const thirdPartyModelIds =
		Object.keys(thirdPartyModels).length > 0 ? new Set(Object.keys(thirdPartyModels)) : undefined

	const result = await syncOpenCodeModelsFromRemote({
		apiKey,
		readOpenCodeConfig,
		writeOpenCodeConfig,
		saveModelsCache,
		pkgName,
		thirdPartyModelIds
	})

	if (!result.ok) {
		logger.warn(`Models sync skipped: ${result.reason}`)
		return undefined
	}

	logger.success(`Models synced: ${result.derivedCount}/${result.rawCount}`)
	return getModelsCache()
}

export const lsCommand = defineCommand({
	meta: {
		name: 'ls',
		description: 'List all profiles'
	},
	args: {
		sync: {
			type: 'boolean',
			description: 'Fetch and sync remote models before listing'
		},
		vendor: {
			type: 'string',
			description: 'Filter displayed models by vendor'
		}
	},
	run: async (ctx) => {
		displayBanner()
		const sync = Boolean(ctx.args.sync)
		const vendor = ctx.args.vendor as string | undefined
		let cache = getModelsCache()

		if (sync) {
			cache = (await runModelsSync()) ?? cache
		} else if (shouldPromptForEmptyCache(cache, Boolean(process.stdin.isTTY && process.stdout.isTTY))) {
			const shouldFetch = await confirm({
				message: 'Models cache empty. Fetch from https://ai.jjuidev.com/models now?',
				initialValue: true
			})

			if (shouldFetch === true) {
				cache = (await runModelsSync()) ?? cache
			} else {
				logger.warn('Models sync skipped. Run `cs ls --sync` later.')
			}
		} else if (!hasModelsCache(cache)) {
			logger.warn('Models cache empty. Run `cs ls --sync` to fetch models.')
		}

		if (hasModelsCache(cache)) {
			renderModels(cache, vendor)
			logger.log('')
		}

		const profiles = getAllProfiles()
		const active = getActiveProfile()

		logger.text('Profiles:\n')

		for (const p of profiles) {
			const marker = active?.name === p.name ? '*' : ' '
			const displayToken = p.token || resolveCsApiKey()

			logger.log(`  ${marker} ${p.name}`)
			logger.muted(`    URL:    ${p.url}`)
			logger.muted(`    Token:  ${displayToken ? maskToken(displayToken) : '<not set>'}`)
			logger.muted(`    Haiku:  ${p.haiku}`)
			logger.muted(`    Sonnet: ${p.sonnet}`)
			logger.muted(`    Opus:   ${p.opus}`)
		}
	}
})
