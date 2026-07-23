import { defineCommand } from 'citty'

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

		logger.success(`Active: ${active.name}`)
		logger.log(`  URL:    ${active.url}`)
		logger.log(`  Token:  ${maskToken(active.token)}`)
		logger.log(`  Haiku:  ${active.haiku}`)
		logger.log(`  Sonnet: ${active.sonnet}`)
		logger.log(`  Opus:   ${active.opus}`)
	}
})
