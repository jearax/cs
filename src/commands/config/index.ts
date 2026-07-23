import { defineCommand } from 'citty'

import { getProfile, upsertProfile } from '@/config/cs-config'
import { Profile } from '@/config/types'
import { displayBanner } from '@/utils/banner'
import { denormalizeModelId } from '@/utils/claude-model-id'
import { maskToken } from '@/utils/format'
import { logger } from '@/utils/logger'
import { validateProfileName } from '@/utils/validation'

/** Auto-derived env vars from model suffix detection */
const detectEnvFromModels = (haiku?: string, sonnet?: string, opus?: string): Record<string, string> => {
	const has1m = [haiku, sonnet, opus].some((id) => id?.endsWith('[1m]'))

	return has1m
		? {
				CLAUDE_CODE_AUTO_COMPACT_WINDOW: '1000000',
				CLAUDE_CODE_DISABLE_1M_CONTEXT: '0'
			}
		: {
				CLAUDE_CODE_DISABLE_1M_CONTEXT: '1'
			}
}

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

			logger.info(`Profile: ${profileName}`)
			logger.log(`  URL:    ${profile.url}`)
			logger.log(`  Token:  ${maskToken(profile.token)}`)
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

		// Auto-detect env vars from model suffix when any model flag is provided.
		// Trigger only on model flag changes (not url/token).
		if (haiku !== undefined || sonnet !== undefined || opus !== undefined) {
			// Compute auto-env from EFFECTIVE profile (current flags + existing values)
			// so partial updates correctly reflect the actual [1m] state.
			const existingProfile = getProfile(profileName)

			const effectiveHaiku = haiku ?? existingProfile?.haiku
			const effectiveSonnet = sonnet ?? existingProfile?.sonnet
			const effectiveOpus = opus ?? existingProfile?.opus
			const autoEnv = detectEnvFromModels(effectiveHaiku, effectiveSonnet, effectiveOpus)

			const mergedEnv = {
				...(existingProfile?.env ?? {}),
				...autoEnv
			}

			// Drop AUTO_COMPACT_WINDOW when no [1m] suffix present
			if (![effectiveHaiku, effectiveSonnet, effectiveOpus].some((id) => id?.endsWith('[1m]'))) {
				delete mergedEnv.CLAUDE_CODE_AUTO_COMPACT_WINDOW
			}

			updates.env = mergedEnv
		}

		upsertProfile(profileName, updates)
		logger.success(`Profile "${profileName}" updated.`)
	}
})
