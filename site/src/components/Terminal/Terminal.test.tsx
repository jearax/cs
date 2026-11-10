import { ThemeProvider } from '@jjuidev/react';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';

import { stripAnsi } from '@/components/Terminal/ansi.util';
import { ALIAS_TRANSCRIPT, CONFIG_TRANSCRIPT, LIST_TRANSCRIPT } from '@/constants/transcripts.constant';

import Terminal from './Terminal';

const TRANSCRIPTS = [CONFIG_TRANSCRIPT, ALIAS_TRANSCRIPT, LIST_TRANSCRIPT];

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
describe('the interleaved transcript', () => {
	const history = [
		{
			prompt: {
				dir: '~',
				git: false
			},
			command: 'cs config -n one',
			lines: ['profile one', 'url one']
		},
		{
			prompt: {
				dir: '~',
				git: false
			},
			command: 'cs config -n two',
			lines: ['profile two']
		}
	];

	it('renders each command followed by its own output, in document order', async () => {
		const screen = await render(
			<Terminal variant="animated" command="cs config -n three" lines={['profile three']} history={history} />,
			{ wrapper: ThemeProvider }
		);

		await expect.element(screen.getByText('profile three')).toBeInTheDocument();

		const order = [...screen.container.querySelectorAll('p')].map((row) => {
			return row.textContent ?? '';
		});

		expect(
			order.filter((text) => {
				return text.startsWith('cs config');
			})
		).toEqual(['cs config -n one', 'cs config -n two', 'cs config -n three']);

		// Every output line sits between its own command and the next one.
		expect(order.indexOf('profile one')).toBeGreaterThan(order.indexOf('cs config -n one'));
		expect(order.indexOf('profile one')).toBeLessThan(order.indexOf('cs config -n two'));
		expect(order.indexOf('profile two')).toBeGreaterThan(order.indexOf('cs config -n two'));
		expect(order.indexOf('profile two')).toBeLessThan(order.indexOf('cs config -n three'));
	});

	it('leaves a blank line between blocks, and none after the last', async () => {
		const screen = await render(
			<Terminal variant="animated" command="cs config -n three" lines={['profile three']} history={history} />,
			{ wrapper: ThemeProvider }
		);

		const order = [...screen.container.querySelectorAll('p')].map((row) => {
			return row.textContent ?? '';
		});

		// The blanks carry a non-breaking space and appear exactly between the blocks.
		const blanks = order
			.map((text, index) => {
				return {
					text,
					index
				};
			})
			.filter(({ text }) => {
				return text === '\u00A0';
			});

		expect(blanks.length).toBe(2);
		expect(blanks[0]!.index).toBeGreaterThan(order.indexOf('profile one'));
		expect(blanks[0]!.index).toBeLessThan(order.indexOf('cs config -n two'));
		expect(blanks[1]!.index).toBeGreaterThan(order.indexOf('profile two'));
		expect(blanks[1]!.index).toBeLessThan(order.indexOf('cs config -n three'));
	});

	it('keeps the last revealed element gating the tab advance', async () => {
		const screen = await render(
			<Terminal
				variant="animated"
				tabs={[
					{
						label: 'one',
						command: 'cs use claude',
						lines: ['Switched to profile "claude".'],
						advance: 100
					},
					{
						label: 'two',
						command: 'cs list',
						lines: []
					}
				]}
			/>,
			{ wrapper: ThemeProvider }
		);

		await expect.element(screen.getByText('Switched to profile "claude".')).toBeInTheDocument();

		/*
		 * The suite runs under prefers-reduced-motion, so the reveal never animates and its end
		 * never fires on its own. The reveal's animationend on the last element is what gates the
		 * advance, so the event is dispatched on it directly.
		 */
		const end = screen.container.querySelector<HTMLElement>('[role="tabpanel"] > p:last-child');

		expect(end?.textContent).toContain('Switched to profile');

		end?.dispatchEvent(new AnimationEvent('animationend', { bubbles: true }));

		await expect
			.poll(
				() => {
					return screen.container.querySelector('button[role="tab"][aria-selected="true"]')?.textContent;
				},
				{ timeout: 3000 }
			)
			.toBe('two');
	});
});
