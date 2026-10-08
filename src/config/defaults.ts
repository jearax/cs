import { join } from 'pathe'

/** macOS-only: read $HOME directly. Cross-platform logic intentionally not supported. */
const HOME = process.env.HOME!

/** Seeds the "default" profile; never merged into the profiles you configure */
export const OFFICIAL_PROFILE = {
	url: 'https://api.anthropic.com',
	token: '',
	haiku: 'claude-haiku-5-5[1m]',
	sonnet: 'claude-sonnet-5-5[1m]',
	opus: 'claude-opus-5-5[1m]',
	fable: 'claude-fable-5-1[1m]'
}

/** A profile created by `cs config` starts blank, so only the flags you pass are set */
export const EMPTY_PROFILE = {
	url: '',
	token: '',
	haiku: '',
	sonnet: '',
	opus: '',
	fable: ''
}

export const TOOL_SETTINGS_PATHS = {
	claude: join(HOME, '.claude', 'settings.json')
}

export const CS_CONFIG_PATH = join(HOME, '.config', 'cs', 'cs.json')
