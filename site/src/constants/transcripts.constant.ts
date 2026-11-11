// Constants for the hero terminal, so the home page and the tests share one list.
//
// Every line is real CLI output, captured from `dist/cli.mjs` in a temp HOME with the plan's dummy
// tokens, `FORCE_COLOR=1`, through a pty. The launcher paths carried the temp HOME; the prefix is
// trimmed to `~`. The config transcript is the verbatim run: every block carries its created
// banner and the launcher hint lines exactly as the CLI printed them. The alias runs had the bin
// dir on PATH already, as an installed user's shell does — no PATH notice prints.

export const CONFIG_TRANSCRIPT: readonly string[] = [
	'Profile "claude" created with the "default" record.',
	'Profile: claude',
	'  URL:    https://api.anthropic.com',
	'  Haiku:  claude-haiku-5-5[1m]',
	'  Sonnet: claude-sonnet-5-5[1m]',
	'  Opus:   claude-opus-5-5[1m]',
	'  Fable:  claude-fable-5-1[1m]',
	'',
	'Profile "work" created with the "default" record.',
	'Profile: work',
	'  URL:    https://api.anthropic.com',
	'  OAuth:  your-cla...oken',
	'  Haiku:  claude-haiku-5-5[1m]',
	'  Sonnet: claude-sonnet-5-5[1m]',
	'  Opus:   claude-opus-5-5[1m]',
	'  Fable:  claude-fable-5-1[1m]',
	'  Settings: ~/.config/cs/profiles/work.json',
	'  Command:  claude --settings ~/.config/cs/profiles/work.json',
	'',
	'Profile "glm" created.',
	'Profile: glm',
	'  URL:    https://api.z.ai/api/anthropic',
	'  Token:  your-glm...oken',
	'  Haiku:  glm-5.3-flash[1m]',
	'  Sonnet: glm-5.3-flash[1m]',
	'  Opus:   glm-5.3-flash[1m]',
	'  Fable:  glm-5.3-flash[1m]',
	'  Settings: ~/.config/cs/profiles/glm.json',
	'  Command:  claude --settings ~/.config/cs/profiles/glm.json',
	'',
	'Profile "minimax" created.',
	'Profile: minimax',
	'  URL:    https://api.minimax.io/anthropic',
	'  Token:  sk-cp-yo...oken',
	'  Haiku:  MiniMax-M3.1-Flash[1m]',
	'  Sonnet: MiniMax-M3.1-Flash[1m]',
	'  Opus:   MiniMax-M3.1-Flash[1m]',
	'  Fable:  MiniMax-M3.1-Flash[1m]',
	'  Settings: ~/.config/cs/profiles/minimax.json',
	'  Command:  claude --settings ~/.config/cs/profiles/minimax.json'
];

export const ALIAS_TRANSCRIPT: readonly string[] = [
	'Alias "planner" created at profile "claude".',
	'Launcher: ~/.config/cs/bin/claude-planner',
	'',
	'Alias "cooker" created at profile "glm".',
	'Launcher: ~/.config/cs/bin/claude-cooker'
];

export const LIST_TRANSCRIPT: readonly string[] = [
	'\u001b[1m\u001b[33mProfiles:\u001b[39m\u001b[22m',
	'  \u001b[32m*\u001b[39m \u001b[1m\u001b[36mdefault\u001b[39m\u001b[22m',
	'      \u001b[2mURL:\u001b[22m    https://api.anthropic.com',
	'      \u001b[2mHaiku:\u001b[22m  claude-haiku-5-5[1m]',
	'      \u001b[2mSonnet:\u001b[22m claude-sonnet-5-5[1m]',
	'      \u001b[2mOpus:\u001b[22m   claude-opus-5-5[1m]',
	'      \u001b[2mFable:\u001b[22m  claude-fable-5-1[1m]',
	'',
	'    \u001b[36mclaude\u001b[39m\u001b[2m [rendered]\u001b[22m',
	'      \u001b[2mURL:\u001b[22m    https://api.anthropic.com',
	'      \u001b[2mHaiku:\u001b[22m  claude-haiku-5-5[1m]',
	'      \u001b[2mSonnet:\u001b[22m claude-sonnet-5-5[1m]',
	'      \u001b[2mOpus:\u001b[22m   claude-opus-5-5[1m]',
	'      \u001b[2mFable:\u001b[22m  claude-fable-5-1[1m]',
	'',
	'    \u001b[36mglm\u001b[39m\u001b[2m [rendered]\u001b[22m',
	'      \u001b[2mURL:\u001b[22m    https://api.z.ai/api/anthropic',
	'      \u001b[2mToken:\u001b[22m  your-glm...oken',
	'      \u001b[2mHaiku:\u001b[22m  glm-5.3-flash[1m]',
	'      \u001b[2mSonnet:\u001b[22m glm-5.3-flash[1m]',
	'      \u001b[2mOpus:\u001b[22m   glm-5.3-flash[1m]',
	'      \u001b[2mFable:\u001b[22m  glm-5.3-flash[1m]',
	'',
	'    \u001b[36mminimax\u001b[39m\u001b[2m [rendered]\u001b[22m',
	'      \u001b[2mURL:\u001b[22m    https://api.minimax.io/anthropic',
	'      \u001b[2mToken:\u001b[22m  sk-cp-yo...oken',
	'      \u001b[2mHaiku:\u001b[22m  MiniMax-M3.1-Flash[1m]',
	'      \u001b[2mSonnet:\u001b[22m MiniMax-M3.1-Flash[1m]',
	'      \u001b[2mOpus:\u001b[22m   MiniMax-M3.1-Flash[1m]',
	'      \u001b[2mFable:\u001b[22m  MiniMax-M3.1-Flash[1m]',
	'',
	'    \u001b[36mwork\u001b[39m\u001b[2m [rendered]\u001b[22m',
	'      \u001b[2mURL:\u001b[22m    https://api.anthropic.com',
	'      \u001b[2mOAuth:\u001b[22m  your-cla...oken',
	'      \u001b[2mHaiku:\u001b[22m  claude-haiku-5-5[1m]',
	'      \u001b[2mSonnet:\u001b[22m claude-sonnet-5-5[1m]',
	'      \u001b[2mOpus:\u001b[22m   claude-opus-5-5[1m]',
	'      \u001b[2mFable:\u001b[22m  claude-fable-5-1[1m]',
	'',
	'\u001b[1m\u001b[33mAliases:\u001b[39m\u001b[22m',
	'  \u001b[36mcooker\u001b[39m \u001b[2m\u2192\u001b[22m \u001b[36mglm\u001b[39m',
	'  \u001b[36mplanner\u001b[39m \u001b[2m\u2192\u001b[22m \u001b[36mclaude\u001b[39m'
];

/**
 * The config and alias outputs split per command, one block per profile: the hero's interleaved
 * config tab shows each command above its own output. The typed lines are the help's Usage form;
 * these outputs are the verbatim run, hint lines and all.
 */
type TranscriptBlock = {
	command: string;
	lines: readonly string[];
};

const splitBlocks = (lines: readonly string[], commands: readonly string[]): readonly TranscriptBlock[] => {
	return lines
		.join('\n')
		.split('\n\n')
		.map((chunk, index) => {
			return {
				command: commands[index] ?? '',
				lines: chunk.split('\n')
			};
		});
};

// The typed commands follow the examples idiom of `cs config --help`: short flags, placeholder
// tokens, long form only where no short exists.
export const CONFIG_BLOCKS: readonly TranscriptBlock[] = splitBlocks(CONFIG_TRANSCRIPT, [
	'cs config -n claude',
	'cs config -n work \\\n--oauth-token <login-token>',
	'cs config --name glm \\\n--url https://api.z.ai/api/anthropic \\\n--token <key> \\\n--haiku glm-5.3-flash[1m] \\\n--sonnet glm-5.3-flash[1m] \\\n--opus glm-5.3-flash[1m]',
	'cs config --name minimax \\\n--url https://api.minimax.io/anthropic \\\n--token sk-cp-... \\\n--haiku MiniMax-M3.1-Flash[1m] \\\n--sonnet MiniMax-M3.1-Flash[1m] \\\n--opus MiniMax-M3.1-Flash[1m]'
]);

export const ALIAS_BLOCKS: readonly TranscriptBlock[] = splitBlocks(ALIAS_TRANSCRIPT, [
	'cs alias planner claude',
	'cs alias cooker glm'
]);

// The `cs use claude` run captured with the bin dir on PATH, so no PATH notice prints; the
// launcher paths carried the temp HOME, trimmed to `~`.
export const USE_TRANSCRIPT: readonly string[] = [
	'Switched to profile "claude".',
	'URL:    https://api.anthropic.com',
	'Haiku:  claude-haiku-5-5[1m]',
	'Sonnet: claude-sonnet-5-5[1m]',
	'Opus:   claude-opus-5-5[1m]',
	'Fable:  claude-fable-5-1[1m]',
	'Settings: ~/.config/cs/profiles/claude.json',
	'Command:  claude --settings ~/.config/cs/profiles/claude.json'
];
