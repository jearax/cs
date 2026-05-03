import { homedir } from 'os'

import { join } from 'pathe'

/** Official Anthropic config — used as the "default" profile */
export const OFFICIAL_PROFILE = {
	url: 'https://api.anthropic.com/v1',
	token: '',
	haiku: 'claude-haiku-4-5',
	sonnet: 'claude-sonnet-4-6',
	opus: 'claude-opus-4-7'
}

/** Paths to CLI tool config files that cs writes into */
export const TOOL_SETTINGS_PATHS = {
	claude: join(homedir(), '.claude', 'settings.json'),
	opencode: join(homedir(), '.config', 'opencode', 'opencode.json')
}

/** cs config store path */
export const CS_CONFIG_PATH = join(homedir(), '.config', 'cs', 'cs.json')

/** Extract provider prefix from package name: "@jjuidev/cs" → "cs" */
export const getProviderPrefix = (pkgName: string): string => pkgName.split('/').pop() ?? pkgName
