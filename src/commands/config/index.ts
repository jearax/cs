import { defineCommand } from 'citty'

import { getProfile, upsertProfile } from '@/config/cs-config'
import { Profile } from '@/config/types'
import { displayBanner } from '@/utils/banner'
import { maskToken } from '@/utils/format'
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
			description: 'API token/key'
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

		const url = ctx.args.url as string | undefined
		const token = ctx.args.token as string | undefined
		const haiku = ctx.args.haiku as string | undefined
		const sonnet = ctx.args.sonnet as string | undefined
		const opus = ctx.args.opus as string | undefined

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

		upsertProfile(profileName, updates)
		logger.success(`Profile "${profileName}" updated.`)
	}
})
