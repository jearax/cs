import { defineCommand } from 'citty'

import { hasModelsCache } from '@/commands/ls/model-display'
import { getModelsCache, getProfile, resolveCsApiKey, upsertProfile, upsertThirdPartyModel } from '@/config/cs-config'
import { Profile } from '@/config/types'
import { displayBanner } from '@/utils/banner'
import { denormalizeModelId } from '@/utils/claude-model-id'
import { maskToken, normalizeModelName } from '@/utils/format'
import { logger } from '@/utils/logger'
import { validateProfileName } from '@/utils/validation'

export const configCommand = defineCommand({
	meta: {
		name: 'config',
		description: 'Manage profile configuration'
	},
	args: {
		name: {
			alias: 'n',
			type: 'string',
			description: 'Profile name (default: "default")'
		},
		url: {
			alias: 'u',
			type: 'string',
			description: 'API base URL'
		},
		token: {
			alias: 't',
			type: 'string',
			description: 'API token'
		},
		haiku: {
			alias: 'h',
			type: 'string',
			description: 'Haiku model'
		},
		sonnet: {
			alias: 's',
			type: 'string',
			description: 'Sonnet model'
		},
		opus: {
			alias: 'o',
			type: 'string',
			description: 'Opus model'
		}
	},
	run: async (ctx) => {
		const profileName = (ctx.args.name as string) || 'default'

		const nameError = validateProfileName(profileName)

		if (nameError) {
			logger.error(nameError)
			return
		}

		const url = ctx.args.url
		const token = ctx.args.token as string | undefined
		const haiku = ctx.args.haiku ? denormalizeModelId(ctx.args.haiku as string) : undefined
		const sonnet = ctx.args.sonnet ? denormalizeModelId(ctx.args.sonnet as string) : undefined
		const opus = ctx.args.opus ? denormalizeModelId(ctx.args.opus as string) : undefined

		const hasUpdates =
			url !== undefined || token !== undefined || haiku !== undefined || sonnet !== undefined || opus !== undefined

		if (!hasUpdates) {
			displayBanner()
			const profile = getProfile(profileName)

			if (!profile) {
				logger.warn(`Profile "${profileName}" not found.`)
				logger.muted(`Create it: cs config -n ${profileName} -u <url>`)
				return
			}

			// Show token: prefer profile.token, fallback to resolved API key
			const displayToken = profile.token || resolveCsApiKey()

			logger.info(`Profile: ${profileName}`)
			logger.log(`  URL:    ${profile.url}`)
			logger.log(`  Token:  ${displayToken ? maskToken(displayToken) : '<not set>'}`)
			logger.log(`  Haiku:  ${profile.haiku}`)
			logger.log(`  Sonnet: ${profile.sonnet}`)
			logger.log(`  Opus:   ${profile.opus}`)
			return
		}

		const updates: Partial<Profile> = {}

		if (url !== undefined) {
			updates.url = url
		}

		if (token !== undefined) {
			updates.token = token
		}

		if (haiku !== undefined) {
			updates.haiku = haiku
		}

		if (sonnet !== undefined) {
			updates.sonnet = sonnet
		}

		if (opus !== undefined) {
			updates.opus = opus
		}

		// Detect third-party models (not in remote registry)
		const modelIds = [haiku, sonnet, opus].filter((id): id is string => id !== undefined)

		if (modelIds.length > 0) {
			const cache = getModelsCache()

			if (!hasModelsCache(cache)) {
				logger.error('Models cache empty. Run `cs ls` to see supported models first.')

				return
			}

			for (const modelId of modelIds) {
				if (!(modelId in cache.models)) {
					const displayName = normalizeModelName(modelId)

					const added = upsertThirdPartyModel({
						id: modelId,
						name: displayName
					})

					if (added) {
						logger.info(`Third-party model "${displayName}" registered.`)
					}
				}
			}
		}

		upsertProfile(profileName, updates)
		logger.success(`Profile "${profileName}" updated.`)
	}
})
