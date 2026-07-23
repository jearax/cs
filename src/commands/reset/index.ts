import { defineCommand } from 'citty'

import { mergeClaudeSettings, readClaudeSettings, writeClaudeSettings } from '@/config/claude-settings'
import { getProfile, loadCsConfig, resetProfiles } from '@/config/cs-config'
import { logger } from '@/utils/logger'

export const resetCommand = defineCommand({
	meta: {
		name: 'reset',
		description: 'Reset to default profile'
	},
	run: async () => {
		const removed = resetProfiles()

		if (removed.length > 0) {
			logger.log(`Removed profiles: ${removed.join(', ')}`)
		}

		// Activate default profile
		const profile = getProfile('default')

		if (!profile) {
			logger.error('Default profile not found after reset.')
			return
		}

		const config = loadCsConfig()
		const globalEnv = config.env ?? {}
		const profileEnv = profile.env ?? {}

		const finalEnv = {
			...globalEnv,
			...profileEnv
		}

		const claudeSettings = readClaudeSettings()

		mergeClaudeSettings(claudeSettings, profile, finalEnv)
		writeClaudeSettings(claudeSettings)

		logger.success('Reset complete. Active profile: default')
	}
})
