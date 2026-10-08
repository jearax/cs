import {
	mergeClaudeSettings,
	readClaudeSettings,
	syncLoginModeSettings,
	writeClaudeSettings
} from '@/config/claude-settings'
import { CsConfig, saveCsConfig } from '@/config/cs-config'
import { Profile } from '@/config/types'

/** settings.json is written first so the owned-key list never claims a key that was not written */
export const activateProfile = (config: CsConfig, name: string, profile: Profile): void => {
	const claudeSettings = readClaudeSettings()

	mergeClaudeSettings(claudeSettings, profile, {
		...config.env,
		...profile.env
	})
	const ownedKeys = syncLoginModeSettings(claudeSettings, profile, config.ownedClaudeSettingsKeys ?? [])

	writeClaudeSettings(claudeSettings)

	config.currentProfile = name
	config.ownedClaudeSettingsKeys = ownedKeys
	saveCsConfig(config)
}
