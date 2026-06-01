import { homedir, platform } from 'os'

import { join } from 'pathe'

/** Official Anthropic config — used as the "default" profile */
export const OFFICIAL_PROFILE = {
	url: 'https://api.anthropic.com/v1',
	token: '',
	haiku: 'claude-haiku-4-5',
	sonnet: 'claude-sonnet-4-6',
	opus: 'claude-opus-4-7'
}

/** Resolve OpenCode config path for each operating system */
export const getOpencodeConfigPathForPlatform = (
	currentPlatform: NodeJS.Platform,
	home: string,
	env: NodeJS.ProcessEnv
): string => {
	if (currentPlatform === 'win32') {
		return join(env.APPDATA || join(home, 'AppData', 'Roaming'), 'opencode', 'opencode.json')
	}

	return join(home, '.config', 'opencode', 'opencode.json')
}

/** Paths to CLI tool config files that cs writes into */
export const TOOL_SETTINGS_PATHS = {
	claude: join(homedir(), '.claude', 'settings.json'),
	opencode: getOpencodeConfigPathForPlatform(platform(), homedir(), process.env)
}

/** cs config store path */
export const CS_CONFIG_PATH = join(homedir(), '.config', 'cs', 'cs.json')

/** Placeholder written to tool config files when profile.token is empty */
export const EMPTY_TOKEN_PLACEHOLDER = 'xxxx-xxxx-xxxx-xxxx'

/** Extract provider prefix from package name: "@jjuidev/cs" → "cs" */
export const getProviderPrefix = (pkgName: string): string => pkgName.split('/').pop() ?? pkgName
