import { join } from 'pathe'

/** macOS-only: read $HOME directly. Cross-platform logic intentionally not supported. */
const HOME = process.env.HOME!

/** Official Anthropic config — used as the "default" profile */
export const OFFICIAL_PROFILE = {
	url: '',
	token: '',
	haiku: 'claude-haiku-4-5',
	sonnet: 'claude-sonnet-5',
	opus: 'claude-opus-5',
	fable: 'claude-fable-5-1'
}

export const TOOL_SETTINGS_PATHS = {
	claude: join(HOME, '.claude', 'settings.json')
}

export const CS_CONFIG_PATH = join(HOME, '.config', 'cs', 'cs.json')
