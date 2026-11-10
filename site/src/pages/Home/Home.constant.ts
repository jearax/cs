/**
 * The home page's own words. The facts about the CLI live in `@/constants/cli.constant.ts`, because
 * the docs area states them too.
 */

import { createElement } from 'react';

import { TerminalTab } from '@/components/Terminal/Terminal';
import { CONFIG_TRANSCRIPT, CURRENT_TRANSCRIPT, USE_TRANSCRIPT } from '@/constants/transcripts.constant';
import ClaudeCodeScreen from '@/pages/Home/components/ClaudeCodeScreen/ClaudeCodeScreen';

/*
 * The value line. One sentence, one copy deck: it wraps naturally under its own width cap, so a
 * narrow viewport never renders a ragged forced break.
 */
export const VALUE_LINES: readonly string[] = [
	'Switch Claude Code between API providers and model sets through named profiles — one command to switch, one file per profile.'
];

export const HERO_TERMINAL_TABS: readonly TerminalTab[] = [
	{
		label: 'config',
		comment: 'Create a profile',
		command: 'cs config -n work -u https://api.anthropic.com -t sk-ant-fake-000',
		prompt: {
			dir: '~',
			git: false
		},
		lines: CONFIG_TRANSCRIPT,
		advance: 2800
	},
	{
		label: 'use',
		comment: 'Switch to it, globally',
		command: 'cs use work',
		prompt: {
			dir: '~',
			git: false
		},
		lines: USE_TRANSCRIPT,
		advance: 2800
	},
	{
		label: 'current',
		comment: 'Which profile is active',
		command: 'cs current',
		prompt: {
			dir: '~',
			git: false
		},
		lines: CURRENT_TRANSCRIPT,
		// The last tab hands back to config, so the hero replays the whole story.
		advance: 3500
	},
	{
		label: 'Claude Code',
		comment: 'Open Claude Code on the active profile',
		history: [
			{
				prompt: {
					dir: '~',
					git: false
				},
				command: 'cs use work'
			}
		],
		command: 'claude',
		screen: createElement(ClaudeCodeScreen),
		// Long enough to read the screen before the window moves on.
		advance: 1000
	}
];
