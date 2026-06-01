import { defineCommand } from 'citty'

import { mergeClaudeSettings, readClaudeSettings, writeClaudeSettings } from '@/config/claude-settings'
import { getProfile, resolveCsApiKey, setCurrentProfile } from '@/config/cs-config'
import {
	generateOpenCodeSection,
	mergeOpenCodeConfig,
	readOpenCodeConfig,
	writeOpenCodeConfig
} from '@/config/opencode-config'
import { maskToken } from '@/utils/format'
import { logger } from '@/utils/logger'

import { name as pkgName } from '@/../package.json'

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
		const profile = getProfile(profileName)

		if (!profile) {
			logger.error(`Profile "${profileName}" not found.`)
			logger.muted('Run: cs config -n <name> to create it.')
			return
		}

		// Deep merge into Claude settings
		const claudeSettings = readClaudeSettings()

		mergeClaudeSettings(claudeSettings, profile, pkgName)
		writeClaudeSettings(claudeSettings)

		// Generate + deep merge into OpenCode config
		const opencodeConfig = readOpenCodeConfig()
		const opencodeSection = generateOpenCodeSection(profile, pkgName)

		mergeOpenCodeConfig(opencodeConfig, opencodeSection)
		writeOpenCodeConfig(opencodeConfig)

		if (!setCurrentProfile(profileName)) {
			logger.error(`Profile "${profileName}" could not be set as current.`)
			return
		}

		// Show effective token: profile.token → resolveCsApiKey() → placeholder
		const effectiveToken = profile.token || resolveCsApiKey()

		logger.success(`Switched to profile "${profileName}".`)
		logger.log(`  URL:    ${profile.url}`)
		logger.log(`  Token:  ${effectiveToken ? maskToken(effectiveToken) : '<not set>'}`)
		logger.log(`  Haiku:  ${profile.haiku}`)
		logger.log(`  Sonnet: ${profile.sonnet}`)
		logger.log(`  Opus:   ${profile.opus}`)
	}
})
