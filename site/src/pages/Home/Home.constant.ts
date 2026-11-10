/**
 * The home page's own words. The facts about the CLI live in `@/constants/cli.constant.ts`, because
 * the docs area states them too.
 */

import { createElement } from 'react';

import { TerminalTab } from '@/components/Terminal/Terminal';
import { ALIAS_BLOCKS, CONFIG_BLOCKS, LIST_TRANSCRIPT } from '@/constants/transcripts.constant';
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
		comment: 'Create the four provider profiles',
		// The typed lines are the help's Usage form; each command's own verbatim output follows it,
		// and the profiles differ by that output alone.
		command: CONFIG_BLOCKS[3]!.command,
		prompt: {
			dir: '~',
			git: false
		},
		history: CONFIG_BLOCKS.slice(0, 3).map((block) => {
			return {
				prompt: {
					dir: '~',
					git: false
				} as const,
				command: block.command,
				lines: block.lines
			};
		}),
		lines: CONFIG_BLOCKS[3]!.lines,
		advance: 2000
	},
	{
		label: 'alias',
		comment: 'Pin the launchers',
		command: ALIAS_BLOCKS[1]!.command,
		prompt: {
			dir: '~',
			git: false
		},
		history: [
			{
				prompt: {
					dir: '~',
					git: false
				},
				command: ALIAS_BLOCKS[0]!.command,
				lines: ALIAS_BLOCKS[0]!.lines
			}
		],
		lines: ALIAS_BLOCKS[1]!.lines,
		advance: 2000
	},
	{
		label: 'ls',
		comment: 'Everything cs keeps',
		command: 'cs ls',
		prompt: {
			dir: '~',
			git: false
		},
		lines: LIST_TRANSCRIPT,
		advance: 2000
	},
	{
		label: 'use',
		comment: 'Switch globally, then open Claude Code',
		history: [
			{
				prompt: {
					dir: '~',
					git: false
				},
				command: 'cs use claude'
			}
		],
		command: 'claude',
		screen: createElement(ClaudeCodeScreen),
		// The screen cycles the three surfaces at 7s each; one full story, then the loop restarts.
		advance: 22000
	}
];
