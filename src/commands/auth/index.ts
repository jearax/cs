import { select, text } from '@clack/prompts'
import { defineCommand } from 'citty'

import { removeCsApiKey, resolveCsApiKey, saveCsApiKey } from '@/config/cs-config'
import { displayBanner } from '@/utils/banner'
import { logger } from '@/utils/logger'

/** Interactive auth menu */
const runAuthInteractive = async (): Promise<void> => {
	const hasKey = Boolean(resolveCsApiKey())

	type AuthOption = { label: string; value: string; hint?: string }

	const options: AuthOption[] = [
		{
			label: 'Set API token',
			value: 'token'
		}
	]

	if (hasKey) {
		options.push({
			label: 'Logout',
			value: 'logout'
		})
	}

	options.push({
		label: 'Exit',
		value: 'exit'
	})

	const choice = await select({
		message: 'Authentication',
		options
	})

	if (choice === 'token') {
		const input = await text({
			message: 'Enter your API key',
			placeholder: 'sk-xxx...'
		})

		if (typeof input !== 'string' || !input.trim()) {
			logger.warn('No key entered. Aborted.')
			return
		}

		saveCsApiKey(input.trim())
		logger.success('API key saved.')
		return
	}

	if (choice === 'logout') {
		if (removeCsApiKey()) {
			logger.success('API key removed.')
		} else {
			logger.warn('No API key to remove.')
		}

		return
	}

	// "exit" or cancelled (symbol)
	logger.muted('Aborted.')
}

export const authCommand = defineCommand({
	meta: {
		name: 'auth',
		description: 'Manage authentication (API key)'
	},
	args: {
		remove: {
			type: 'boolean',
			alias: 'r',
			description: 'Remove saved API key'
		}
	},
	run: async (ctx) => {
		displayBanner()

		const remove = Boolean(ctx.args.remove)

		if (remove) {
			if (removeCsApiKey()) {
				logger.success('API key removed.')
			} else {
				logger.warn('No API key to remove.')
			}

			return
		}

		await runAuthInteractive()
	}
})
