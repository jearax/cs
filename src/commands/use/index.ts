import { defineCommand } from 'citty'

import { mergeClaudeSettings, readClaudeSettings, writeClaudeSettings } from '@/config/claude-settings'
import { loadCsConfig, setCurrentProfile } from '@/config/cs-config'
import { maskToken } from '@/utils/format'
import { logger } from '@/utils/logger'

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
		const profileName = ctx.args.name as string
		const config = loadCsConfig()
		const profile = config.claude[profileName]

		if (!profile) {
			logger.error(`Profile "${profileName}" not found.`)
			logger.muted('Run: cs config -n <name> to create it.')
			return
		}

		// Build final env from cs.json (cs.env + profile.env). Profile wins.
		const globalEnv = config.env ?? {}
		const profileEnv = profile.env ?? {}

		const finalEnv = {
			...globalEnv,
			...profileEnv
		}

		// Read settings + merge (DEFAULT_GLOBAL_ENV applied inside mergeClaudeSettings)
		const claudeSettings = readClaudeSettings()

		mergeClaudeSettings(claudeSettings, profile, finalEnv)
		writeClaudeSettings(claudeSettings)

		if (!setCurrentProfile(profileName)) {
			logger.error(`Profile "${profileName}" could not be set as current.`)
			return
		}

		logger.success(`Switched to profile "${profileName}".`)
		logger.log(`  URL:    ${profile.url}`)
		logger.log(`  Token:  ${maskToken(profile.token)}`)
		logger.log(`  Haiku:  ${profile.haiku}`)
		logger.log(`  Sonnet: ${profile.sonnet}`)
		logger.log(`  Opus:   ${profile.opus}`)
	}
})
