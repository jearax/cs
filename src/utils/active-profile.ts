import { readClaudeSettings } from '@/config/claude-settings'
import { getAllProfiles } from '@/config/cs-config'
import { Profile, ClaudeSettings } from '@/config/types'
import { isEmptyToken } from '@/utils/format'

/** Reverse-detect active profile from claude settings env vars */
export const detectActiveProfile = (
	settings: ClaudeSettings,
	profiles: (Profile & { name: string })[]
): (Profile & { name: string }) | null => {
	const env = settings.env

	if (!env) {
		return null
	}

	const url = env.ANTHROPIC_BASE_URL

	if (!url) {
		return null
	}

	for (const p of profiles) {
		if (p.url === url) {
			const token = env.ANTHROPIC_AUTH_TOKEN

			if (isEmptyToken(p.token) && isEmptyToken(token)) {
				return p
			}

			if (p.token === token) {
				return p
			}
		}
	}

	return null
}

/** Convenience: get current active profile */
export const getActiveProfile = (): (Profile & { name: string }) | null => {
	const settings = readClaudeSettings()
	const profiles = getAllProfiles()

	return detectActiveProfile(settings, profiles)
}
