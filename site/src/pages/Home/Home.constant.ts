/**
 * The home page's own words. The facts about the CLI live in `@/constants/cli.constant.ts`, because
 * the docs area states them too.
 */

import { createElement } from 'react';

import { TerminalTab } from '@/components/Terminal/Terminal';
import { ALIAS_BLOCKS, CONFIG_BLOCKS, LIST_TRANSCRIPT, USE_TRANSCRIPT } from '@/constants/transcripts.constant';
import ClaudeCodeScreen, { CLAUDE_SESSION_MS } from '@/pages/Home/components/ClaudeCodeScreen/ClaudeCodeScreen';

/*
 * The value line. One sentence, one copy deck: it wraps naturally under its own width cap, so a
 * narrow viewport never renders a ragged forced break.
 */
export const VALUE_LINES: readonly string[] = [
	'Switch Claude Code between API providers and model sets through named profiles — one command to switch, one file per profile.'
];

// How each launcher is used, shown under the alias run that creates it.
const ALIAS_USAGE: readonly string[] = [
	'Use claude-planner to run the claude profile',
	'Use claude-cooker to run the glm profile'
];

export const HERO_TERMINAL_TABS: readonly TerminalTab[] = [
	{
		label: 'config',
		comment: 'Create the four provider profiles',
		// The typed lines are the help's Usage form; each profile's run gets its own screen — the
		// tab types `clear` after each run — and the profiles differ by that output alone.
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
				lines: block.lines,
				clear: true
			};
		}),
		lines: CONFIG_BLOCKS[3]!.lines,
		advance: 2000
	},
	{
		label: 'alias',
		comment: 'Pin the launchers, then list everything cs keeps',
		command: 'cs ls',
		prompt: {
			dir: '~',
			git: false
		},
		// Both alias runs share one screen; the typed `clear` then makes way for the full list.
		history: ALIAS_BLOCKS.map((block, index) => {
			return {
				prompt: {
					dir: '~',
					git: false
				} as const,
				comment: ALIAS_USAGE[index]!,
				command: block.command,
				lines: block.lines,
				// The last run clears before `cs ls`; the list itself ends the tab.
				clear: index === ALIAS_BLOCKS.length - 1
			};
		}),
		lines: LIST_TRANSCRIPT,
		// The alias runs stay up longer than a config page, so the launchers are read before the list.
		clearWait: 2500,
		advance: 2000
	},
	{
		label: 'use',
		comment: 'Switch globally or use aliases, then open Claude Code',
		// One session story in three pages: every command runs in my-app and the typed clear, not a
		// blank line, makes way for the next session.
		gap: false,
		history: [
			{
				command: 'cs use claude',
				lines: USE_TRANSCRIPT
			},
			{
				command: 'claude',
				screen: createElement(ClaudeCodeScreen, { session: 'claude' }),
				screenMs: CLAUDE_SESSION_MS,
				clear: true
			},
			{
				command: 'claude-planner',
				screen: createElement(ClaudeCodeScreen, { session: 'planner' }),
				screenMs: CLAUDE_SESSION_MS,
				clear: true
			}
		],
		command: 'claude-cooker',
		screen: createElement(ClaudeCodeScreen, { session: 'cooker' }),
		// The cooker session ends the story; hold it a moment before the loop restarts.
		advance: CLAUDE_SESSION_MS + 2000
	}
];
