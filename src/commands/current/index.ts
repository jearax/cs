import { defineCommand } from 'citty'

import { resolveCsApiKey } from '@/config/cs-config'
import { getActiveProfile } from '@/utils/active-profile'
import { displayBanner } from '@/utils/banner'
import { maskToken } from '@/utils/format'
import { logger } from '@/utils/logger'

export const currentCommand = defineCommand({
	meta: {
		name: 'current',
		description: 'Show current active profile'
	},
	run: async () => {
		displayBanner()
		const active = getActiveProfile()

		if (!active) {
			logger.warn('No active profile detected.')
			logger.muted('Run: cs use <profile>')
			return
		}

		const displayToken = active.token || resolveCsApiKey()

		logger.success(`Active: ${active.name}`)
		logger.log(`  URL:    ${active.url}`)
		logger.log(`  Token:  ${displayToken ? maskToken(displayToken) : '<not set>'}`)
		logger.log(`  Haiku:  ${active.haiku}`)
		logger.log(`  Sonnet: ${active.sonnet}`)
		logger.log(`  Opus:   ${active.opus}`)
	}
})
