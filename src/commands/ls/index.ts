import { defineCommand } from 'citty'

import { getAllProfiles } from '@/config/cs-config'
import { getActiveProfile } from '@/utils/active-profile'
import { displayBanner } from '@/utils/banner'
import { maskToken } from '@/utils/format'
import { logger } from '@/utils/logger'

export const lsCommand = defineCommand({
	meta: {
		name: 'ls',
		description: 'List all profiles'
	},
	run: async () => {
		displayBanner()
		const profiles = getAllProfiles()
		const active = getActiveProfile()

		logger.text('Profiles:\n')

		for (const p of profiles) {
			const marker = active?.name === p.name ? '*' : ' '

			logger.log(`  ${marker} ${p.name}`)
			logger.muted(`    URL:    ${p.url}`)
			logger.muted(`    Token:  ${maskToken(p.token)}`)
			logger.muted(`    Haiku:  ${p.haiku}`)
			logger.muted(`    Sonnet: ${p.sonnet}`)
			logger.muted(`    Opus:   ${p.opus}`)
		}
	}
})
