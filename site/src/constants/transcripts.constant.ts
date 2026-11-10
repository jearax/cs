/**
 * The CLI's real output, captured from the built CLI in a temp HOME with fake tokens, `FORCE_COLOR=1`,
 * so every line keeps the ANSI colour codes the CLI printed; the terminal renders them through the
 * design system's tokens.
 */

export const CONFIG_TRANSCRIPT: readonly string[] = [
	'Profile "work" created with the "default" record.',
	'Profile: work',
	'  URL:    https://api.anthropic.com',
	'  Token:  sk-ant-f...-000',
	'  Haiku:  claude-haiku-5-5[1m]',
	'  Sonnet: claude-sonnet-5-5[1m]',
	'  Opus:   claude-opus-5-5[1m]',
	'  Fable:  claude-fable-5-1[1m]',
	'  Settings: ~/.config/cs/profiles/work.json',
	'  Command:  claude --settings ~/.config/cs/profiles/work.json'
];

export const USE_TRANSCRIPT: readonly string[] = [
	'Switched to profile "work".',
	'  URL:    https://api.anthropic.com',
	'  Token:  sk-ant-f...-000',
	'  Haiku:  claude-haiku-5-5[1m]',
	'  Sonnet: claude-sonnet-5-5[1m]',
	'  Opus:   claude-opus-5-5[1m]',
	'  Fable:  claude-fable-5-1[1m]',
	'  Settings: ~/.config/cs/profiles/work.json',
	'  Command:  claude --settings ~/.config/cs/profiles/work.json'
];

export const CURRENT_TRANSCRIPT: readonly string[] = [
	'Active: work',
	'  URL:    https://api.anthropic.com',
	'  Token:  sk-ant-f...-000',
	'  Haiku:  claude-haiku-5-5[1m]',
	'  Sonnet: claude-sonnet-5-5[1m]',
	'  Opus:   claude-opus-5-5[1m]',
	'  Fable:  claude-fable-5-1[1m]',
	'Rendered profiles: personal, work'
];

export const LIST_TRANSCRIPT: readonly string[] = [
	'\u001b[1m\u001b[33mProfiles:\u001b[39m\u001b[22m',
	'    \u001b[36mdefault\u001b[39m',
	'      \u001b[2mURL:\u001b[22m    https://api.anthropic.com',
	'      \u001b[2mHaiku:\u001b[22m  claude-haiku-5-5[1m]',
	'      \u001b[2mSonnet:\u001b[22m claude-sonnet-5-5[1m]',
	'      \u001b[2mOpus:\u001b[22m   claude-opus-5-5[1m]',
	'      \u001b[2mFable:\u001b[22m  claude-fable-5-1[1m]',
	'',
	'    \u001b[36mpersonal\u001b[39m\u001b[2m [rendered]\u001b[22m',
	'      \u001b[2mURL:\u001b[22m    https://api.custom.dev',
	'      \u001b[2mOAuth:\u001b[22m  sk-ot-fa...-000',
	'      \u001b[2mHaiku:\u001b[22m  claude-haiku-5-5[1m]',
	'      \u001b[2mSonnet:\u001b[22m claude-sonnet-5-5[1m]',
	'      \u001b[2mOpus:\u001b[22m   claude-opus-5-5[1m]',
	'      \u001b[2mFable:\u001b[22m  claude-fable-5-1[1m]',
	'',
	'  \u001b[32m*\u001b[39m \u001b[1m\u001b[36mwork\u001b[39m\u001b[22m\u001b[2m [rendered]\u001b[22m',
	'      \u001b[2mURL:\u001b[22m    https://api.anthropic.com',
	'      \u001b[2mToken:\u001b[22m  sk-ant-f...-000',
	'      \u001b[2mHaiku:\u001b[22m  claude-haiku-5-5[1m]',
	'      \u001b[2mSonnet:\u001b[22m claude-sonnet-5-5[1m]',
	'      \u001b[2mOpus:\u001b[22m   claude-opus-5-5[1m]',
	'      \u001b[2mFable:\u001b[22m  claude-fable-5-1[1m]',
	'',
	'\u001b[1m\u001b[33mAliases:\u001b[39m\u001b[22m',
	'  \u001b[36mclaude-work\u001b[39m \u001b[2m→\u001b[22m \u001b[36mwork\u001b[39m'
];

export const ALIAS_TRANSCRIPT: readonly string[] = [
	'Alias "claude-work" created at profile "work".',
	'  Launcher: ~/.config/cs/bin/claude-claude-work',
	'Add ~/.config/cs/bin to your PATH to run the launchers:',
	'  export PATH="$HOME/.config/cs/bin:$PATH"   (add it to ~/.zshrc)'
];

/**
 * The terminal's own label. The transcripts are real runs, but the versions and the paths in them are
 * the ones this machine had, so the frame says so rather than presenting them as fixed output.
 */
export const TERMINAL_LABEL = 'Example output';
