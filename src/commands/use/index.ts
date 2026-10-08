import { defineCommand } from 'citty'

import { activateProfile } from '@/config/activate-profile'
import { findProfile, loadCsConfig } from '@/config/cs-config'
import { maskToken } from '@/utils/format'
import { logger } from '@/utils/logger'
import { hasTokenWithoutUrl, TOKEN_WITHOUT_URL_HINT } from '@/utils/login-mode-profile'
import { validateProfileName } from '@/utils/validation'

export const useCommand = defineCommand({
	meta: {
		name: 'use',
		description: 'Switch to a profile'
	},
	args: {
		name: {
			type: 'positional',
			name: 'name',
			required: true,
			description: 'Profile name to switch to'
		}
	},
	run: async (ctx) => {
		const profileName = (ctx.args.name as string).trim()

		const nameError = validateProfileName(profileName)

		if (nameError) {
			logger.error(nameError)
			return
		}

		const config = loadCsConfig()
		const profile = findProfile(config, profileName)

		if (!profile) {
			logger.error(`Profile "${profileName}" not found.`)
			logger.muted('Run: cs config -n <name> to create it.')
			return
		}

		// Legacy cs.json may predate the `cs config` guard
		if (hasTokenWithoutUrl(profile)) {
			logger.error(`Profile "${profileName}" has a token but no URL.`)
			logger.muted(TOKEN_WITHOUT_URL_HINT)
			return
		}

		activateProfile(config, profileName, profile)

		logger.success(`Switched to profile "${profileName}".`)
		logger.log(`  URL:    ${profile.url}`)
		logger.log(`  Token:  ${maskToken(profile.token)}`)
		logger.log(`  Haiku:  ${profile.haiku}`)
		logger.log(`  Sonnet: ${profile.sonnet}`)
		logger.log(`  Opus:   ${profile.opus}`)
		logger.log(`  Fable:  ${profile.fable}`)
	}
})
