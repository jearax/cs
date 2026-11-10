// Constants for the hero terminal, so the home page and the tests share one list.
//
// Every line is real CLI output, captured from `dist/cli.mjs` in a temp HOME with the plan's dummy
// tokens, `FORCE_COLOR=1`, through a pty. The alias launcher paths carried the temp HOME; the
// prefix is trimmed to `~`. The output is real, with one edit: the trailing `Settings:` and
// `Command:` hint lines are dropped from the config blocks to keep the hero short — every other
// character is verbatim.

export const CONFIG_TRANSCRIPT: readonly string[] = [
	'Profile "claude" created with the "default" record.',
	'Profile: claude',
	'  URL:    https://api.anthropic.com',
	'  Haiku:  claude-haiku-5-5[1m]',
	'  Sonnet: claude-sonnet-5-5[1m]',
	'  Opus:   claude-opus-5-5[1m]',
	'  Fable:  claude-fable-5-1[1m]',
	'',
	'Profile "claude-company" created with the "default" record.',
	'Profile: claude-company',
	'  URL:    https://api.anthropic.com',
	'  OAuth:  your-cla...oken',
	'  Haiku:  claude-haiku-5-5[1m]',
	'  Sonnet: claude-sonnet-5-5[1m]',
	'  Opus:   claude-opus-5-5[1m]',
	'  Fable:  claude-fable-5-1[1m]',
	'',
	'Profile "glm" created with the "default" record.',
	'Profile: glm',
	'  URL:    https://api.z.ai/api/anthropic',
	'  Token:  your-glm...oken',
	'  Haiku:  glm-5.3-flash[1m]',
	'  Sonnet: glm-5.3-flash[1m]',
	'  Opus:   glm-5.3-flash[1m]',
	'  Fable:  glm-5.3-flash[1m]',
	'',
	'Profile "minimax" created with the "default" record.',
	'Profile: minimax',
	'  URL:    https://api.minimax.io/anthropic',
	'  Token:  sk-cp-yo...oken',
	'  Haiku:  MiniMax-M3.1-Flash[1m]',
	'  Sonnet: MiniMax-M3.1-Flash[1m]',
	'  Opus:   MiniMax-M3.1-Flash[1m]',
	'  Fable:  MiniMax-M3.1-Flash[1m]',
	''
];

export const ALIAS_TRANSCRIPT: readonly string[] = [
	'Alias "planner" created at profile "claude".',
	'  Launcher: ~/.config/cs/bin/claude-planner',
	'Add ~/.config/cs/bin to your PATH to run the launchers:',
	'  export PATH="$HOME/.config/cs/bin:$PATH"   (add it to ~/.zshrc)',
	'',
	'Alias "cooker" created at profile "glm".',
	'  Launcher: ~/.config/cs/bin/claude-cooker',
	'Add ~/.config/cs/bin to your PATH to run the launchers:',
	'  export PATH="$HOME/.config/cs/bin:$PATH"   (add it to ~/.zshrc)'
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
	'    \u001b[36mclaude-company\u001b[39m\u001b[2m [rendered]\u001b[22m',
	'      \u001b[2mURL:\u001b[22m    https://api.anthropic.com',
	'      \u001b[2mOAuth:\u001b[22m  your-cla...oken',
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
	'\u001b[1m\u001b[33mAliases:\u001b[39m\u001b[22m',
	'  \u001b[36mcooker\u001b[39m \u001b[2m\u2192\u001b[22m \u001b[36mglm\u001b[39m',
	'  \u001b[36mplanner\u001b[39m \u001b[2m\u2192\u001b[22m \u001b[36mclaude\u001b[39m'
];

/**
 * The config and alias outputs split per command, one block per profile: the hero's interleaved
 * config tab shows each command above its own output. The typed lines are the help's Usage form;
 * these outputs are the real run, minus the hero's dropped hint lines.
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
	'cs config -n claude-company --oauth-token <login-token>',
	'cs config -n glm -u https://api.z.ai/api/anthropic -t <key> -s glm-5.3-flash[1m]',
	'cs config -n minimax -u https://api.minimax.io/anthropic -t sk-cp-... -s MiniMax-M3.1-Flash[1m]'
]);

export const ALIAS_BLOCKS: readonly TranscriptBlock[] = splitBlocks(ALIAS_TRANSCRIPT, [
	'cs alias planner claude',
	'cs alias cooker glm'
]);
