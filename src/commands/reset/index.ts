import { defineCommand } from 'citty'

import { activateProfile } from '@/config/activate-profile'
import { findProfile, loadCsConfig, resetProfiles } from '@/config/cs-config'
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

		const config = loadCsConfig()
		const profile = findProfile(config, 'default')

		if (!profile) {
			logger.error('Default profile not found after reset.')
			return
		}

		activateProfile(config, 'default', profile)

		logger.success('Reset complete. Active profile: default')
	}
})
