import { join } from 'pathe'

/** macOS-only: read $HOME directly. Cross-platform logic intentionally not supported. */
const HOME = process.env.HOME!

/** Official Anthropic config — used as the "default" profile */
export const OFFICIAL_PROFILE = {
	url: '',
	token: '',
	haiku: 'claude-haiku-4-5',
	sonnet: 'claude-sonnet-5',
	opus: 'claude-opus-5'
}

/** Path to Claude settings.json that cs writes into */
export const TOOL_SETTINGS_PATHS = {
	claude: join(HOME, '.claude', 'settings.json')
}

/** cs config store path */
export const CS_CONFIG_PATH = join(HOME, '.config', 'cs', 'cs.json')

/** Hardcoded global env defaults — merged into cs.json.env at save point */
export const DEFAULT_GLOBAL_ENV: Record<string, string> = {
	CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: '1'
}
