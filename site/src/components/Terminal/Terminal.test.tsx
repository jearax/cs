import { ThemeProvider } from '@jjuidev/react';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';

import { stripAnsi } from '@/components/Terminal/ansi.util';
import {
	ALIAS_TRANSCRIPT,
	CONFIG_TRANSCRIPT,
	CURRENT_TRANSCRIPT,
	LIST_TRANSCRIPT,
	USE_TRANSCRIPT
} from '@/constants/transcripts.constant';

import Terminal from './Terminal';

const TRANSCRIPTS = [CONFIG_TRANSCRIPT, USE_TRANSCRIPT, CURRENT_TRANSCRIPT, LIST_TRANSCRIPT, ALIAS_TRANSCRIPT];

const COMMAND = 'cs current';
const OTHER = 'cs list';

describe('Terminal', () => {
	it('prints every line exactly as the CLI printed it', async () => {
		for (const lines of TRANSCRIPTS) {
			const screen = await render(<Terminal lines={lines} />, { wrapper: ThemeProvider });

			const rendered = [...screen.container.querySelectorAll('p')].map((line) => {
				return line.textContent;
			});

			expect(rendered).toEqual(
				lines.map((line) => {
					return stripAnsi(line);
				})
			);
		}
	});

	it('colours the active marker with the colour the CLI printed', async () => {
		const screen = await render(<Terminal lines={LIST_TRANSCRIPT} />, { wrapper: ThemeProvider });

		const glyphs = [...screen.container.querySelectorAll('span')].filter((span) => {
			return span.textContent === '*';
		});

		expect(glyphs.length).toBeGreaterThan(0);

		for (const glyph of glyphs) {
			expect(glyph.getAttribute('data-color')).toBe('success');
		}
	});

	it('keeps the dimmed labels quiet', async () => {
		const screen = await render(<Terminal lines={LIST_TRANSCRIPT} />, { wrapper: ThemeProvider });

		const dimmed = [...screen.container.querySelectorAll('span')].filter((span) => {
			return ['URL:', 'Token:', 'OAuth:', 'Haiku:', 'Sonnet:', 'Opus:', 'Fable:'].includes(span.textContent ?? '');
		});

		expect(dimmed.length).toBeGreaterThan(0);

		for (const label of dimmed) {
			expect(label.getAttribute('data-dim')).toBe('true');
		}
	});

	it('offers no copy button unless the window asks for one', async () => {
		const screen = await render(<Terminal command={COMMAND} lines={[]} />, { wrapper: ThemeProvider });

		expect(screen.container.querySelector('button')).toBeNull();
	});

	it('puts an icon-only copy button beside the command, and it copies the command', async () => {
		const screen = await render(<Terminal command={COMMAND} lines={[]} commandCopy />, { wrapper: ThemeProvider });

		const button = screen.getByRole('button', { name: 'Copy the command' });

		await expect.element(button).toBeInTheDocument();
		expect(screen.container.querySelector('button')?.textContent).toBe('');

		await button.click();

		await expect
			.poll(() => {
				return navigator.clipboard.readText();
			})
			.toBe(COMMAND);
	});

	it('opens a tab transcript with the shell comment the tab carries', async () => {
		const screen = await render(
			<Terminal
				tabs={[
					{
						label: '~',
						comment: 'Check the environment',
						command: COMMAND,
						lines: []
					}
				]}
			/>,
			{ wrapper: ThemeProvider }
		);

		await expect.element(screen.getByText('# Check the environment')).toBeInTheDocument();
	});

	it('shows a window-level comment for a window with a single transcript', async () => {
		const screen = await render(<Terminal comment="Check the environment" command={COMMAND} lines={[]} />, {
			wrapper: ThemeProvider
		});

		await expect.element(screen.getByText('# Check the environment')).toBeInTheDocument();
	});

	it('copies the active tab command, and a tab switch retypes the transcript', async () => {
		const screen = await render(
			<Terminal
				commandCopy
				tabs={[
					{
						label: 'one',
						command: COMMAND,
						lines: []
					},
					{
						label: 'two',
						command: OTHER,
						lines: []
					}
				]}
			/>,
			{ wrapper: ThemeProvider }
		);

		await screen.getByRole('button', { name: 'Copy the command' }).click();

		await expect
			.poll(() => {
				return navigator.clipboard.readText();
			})
			.toBe(COMMAND);

		await screen.getByRole('tab', { name: 'two' }).click();

		await expect.element(screen.getByText(new RegExp(OTHER))).toBeInTheDocument();

		await screen.getByRole('button', { name: 'Copy the command' }).click();

		await expect
			.poll(() => {
				return navigator.clipboard.readText();
			})
			.toBe(OTHER);
	});
});
