import { select, text } from '@clack/prompts'
import { defineCommand } from 'citty'

import { getAllProfiles, loadCsConfig, saveCsConfig } from '@/config/cs-config'
import { DEFAULT_GLOBAL_ENV } from '@/config/defaults'
import { displayBanner } from '@/utils/banner'
import { logger } from '@/utils/logger'

const ENV_KEY_PATTERN = /^[A-Z][A-Z0-9_]*$/

const isString = (value: unknown): value is string => typeof value === 'string'

export const envCommand = defineCommand({
	meta: {
		name: 'env',
		description: 'Configure env vars (global or per-profile)'
	},
	run: async () => {
		displayBanner()

		const scope = await select({
			message: 'Configure env for:',
			options: [
				{
					label: 'Global',
					value: 'global'
				},
				{
					label: 'Profile',
					value: 'profile'
				}
			]
		})

		if (!isString(scope)) {
			logger.muted('Aborted.')
			return
		}

		let profileName: string | undefined

		if (scope === 'profile') {
			const profiles = getAllProfiles()

			if (profiles.length === 0) {
				logger.warn('No profiles found. Create one with: cs config -n <name>')
				return
			}

			const selected = await select({
				message: 'Select profile:',
				options: profiles.map((p) => ({
					label: p.name,
					value: p.name
				}))
			})

			if (!isString(selected)) {
				logger.muted('Aborted.')
				return
			}

			profileName = selected
		}

		const action = await select({
			message: 'Action:',
			options: [
				{
					label: 'Set',
					value: 'set'
				},
				{
					label: 'Unset',
					value: 'unset'
				}
			]
		})

		if (!isString(action)) {
			logger.muted('Aborted.')
			return
		}

		const key = await text({
			message: 'Env key:',
			validate: (input) =>
				input !== undefined && ENV_KEY_PATTERN.test(input) ? undefined : 'Invalid. Must match [A-Z][A-Z0-9_]*'
		})

		if (!isString(key)) {
			logger.muted('Aborted.')
			return
		}

		let value: string | undefined

		if (action === 'set') {
			const input = await text({ message: `Value for ${key}:` })

			if (!isString(input)) {
				logger.muted('Aborted.')
				return
			}

			value = input
		}

		const config = loadCsConfig()

		if (profileName) {
			const profile = config.claude[profileName]

			if (!profile) {
				logger.error(`Profile "${profileName}" not found.`)
				return
			}

			const existingEnv = profile.env ?? {}
			const newEnv = { ...existingEnv }

			if (action === 'set' && value !== undefined) {
				newEnv[key] = value
			} else {
				delete newEnv[key]
			}

			config.claude[profileName] = {
				...profile,
				env: newEnv
			}
		} else {
			// Global env — merge DEFAULT_GLOBAL_ENV at save point
			const existingEnv = config.env ?? {}

			const newEnv = {
				...DEFAULT_GLOBAL_ENV,
				...existingEnv
			}

			if (action === 'set' && value !== undefined) {
				newEnv[key] = value
			} else {
				delete newEnv[key]
			}

			config.env = newEnv
		}

		saveCsConfig(config)

		const target = profileName ? `profile:"${profileName}"` : 'global'

		if (action === 'set') {
			// Don't print raw value — it may be a secret (API key, token, etc.)
			logger.success(`Saved ${key} to ${target}.`)
		} else {
			logger.success(`Removed ${key} from ${target}.`)
		}
	}
})
