import { ThemeProvider } from '@jjuidev/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
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

	it('hands the caret to the next command when that command appears', async () => {
		const screen = await render(
			<Terminal variant="animated" command="cs config -n three" lines={['profile three']} history={history} />,
			{ wrapper: ThemeProvider }
		);

		const rows = [...screen.container.querySelectorAll<HTMLElement>('[data-last-line="true"]')];

		const rowAt = (index: number) => {
			return rows[index]?.closest<HTMLElement>('div')?.style.getPropertyValue('--at');
		};

		expect(
			rows.map((row) => {
				return row.textContent;
			})
		).toEqual(['cs config -n one', 'cs config -n two', 'cs config -n three']);
		expect(rows[0]?.style.getPropertyValue('--caret-until')).toBe(rowAt(1));
		expect(rows[1]?.style.getPropertyValue('--caret-until')).toBe(rowAt(2));
		// The newest command keeps its caret.
		expect(rows[2]?.style.getPropertyValue('--caret-until')).toBe('');
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

	it('keeps looping after the reader picks a tab', async () => {
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

		await screen.getByRole('tab', { name: 'one' }).click();
		await expect.element(screen.getByText('Switched to profile "claude".')).toBeInTheDocument();

		const end = screen.container.querySelector<HTMLElement>('[role="tabpanel"] > p:last-child');

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
describe('a typed shell continuation', () => {
	const TWO_LINE = 'cs config -n glm -u https://api.z.ai/api/anthropic \\\n-t <key> -s glm-5.3-flash[1m]';

	it('types one element per physical line, prompt on the first', async () => {
		const screen = await render(
			<Terminal variant="animated" command={TWO_LINE} lines={['Profile "glm" created with the "default" record.']} />,
			{ wrapper: ThemeProvider }
		);

		await expect.element(screen.getByText('-t <key> -s glm-5.3-flash[1m]')).toBeInTheDocument();

		const lines = [...screen.container.querySelectorAll('[class*="commandLine"]')];

		expect(lines.length).toBe(2);

		// The first physical line sits in the prompt's row; the second is its continuation.
		const rows = [...screen.container.querySelectorAll('[class*="commandRow"]')];

		expect(rows.length).toBe(1);
		expect(rows[0]!.textContent).toContain('cs config -n glm');
		expect(lines[0]!.textContent).toContain('cs config -n glm');
		expect(lines[1]!.textContent).toContain('-t <key>');
	});

	it('puts the caret on the last physical line only', async () => {
		const screen = await render(<Terminal variant="animated" command={TWO_LINE} lines={[]} />, {
			wrapper: ThemeProvider
		});

		const lines = [...screen.container.querySelectorAll('[class*="commandLine"]')];

		expect(lines[0]!.getAttribute('data-last-line')).toBe('false');
		expect(lines[1]!.getAttribute('data-last-line')).toBe('true');
	});

	it('copies the one logical command, continuation joined with a space', async () => {
		const screen = await render(<Terminal variant="animated" command={TWO_LINE} lines={[]} commandCopy />, {
			wrapper: ThemeProvider
		});

		await screen.getByRole('button', { name: 'Copy the command' }).click();

		await expect
			.poll(() => {
				return navigator.clipboard.readText();
			})
			.toBe('cs config -n glm -u https://api.z.ai/api/anthropic -t <key> -s glm-5.3-flash[1m]');
	});

	it('shows the output block after the full command has typed', async () => {
		const screen = await render(
			<Terminal variant="animated" command={TWO_LINE} lines={['Profile "glm" created with the "default" record.']} />,
			{ wrapper: ThemeProvider }
		);

		// The single-transcript window has no tabpanel; the body carries the rows and the output.
		const body = screen.container.querySelector('[class*="Terminal_body"]') ?? screen.container;

		const children = [...body.children].map((el) => {
			return el.className;
		});

		// The command row comes before the output line in the document.
		const row = children.findIndex((cls) => {
			return cls.includes('commandRow');
		});

		const output = children.findIndex((cls) => {
			return cls.includes('line');
		});

		expect(row).toBeGreaterThan(-1);
		expect(output).toBeGreaterThan(row);
	});
});
describe('paging with a typed clear', () => {
	/*
	 * The suite runs under prefers-reduced-motion: the stub answers the component's query with "no
	 * preference" so paging engages, while the real reduced motion keeps the animations off and the
	 * animationend events the test's to dispatch.
	 */
	const stubMotionOn = () => {
		const real = window.matchMedia.bind(window);

		vi.stubGlobal(
			'matchMedia',
			vi.fn((query: string) => {
				return query === '(prefers-reduced-motion: reduce)'
					? ({
							matches: false,
							media: query
						} as MediaQueryList)
					: real(query);
			})
		);
	};

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	const pagingTabs = [
		{
			label: 'one',
			comment: 'One screen per profile',
			prompt: {
				dir: '~',
				git: false
			},
			command: 'cs config -n two',
			lines: ['profile two'],
			history: [
				{
					prompt: {
						dir: '~',
						git: false
					},
					command: 'cs config -n one',
					lines: ['profile one'],
					clear: true
				}
			],
			advance: 100
		},
		{
			label: 'two',
			command: 'cs list',
			lines: ['Aliases:']
		}
	];

	const renderPaged = async (props = {}) => {
		return await render(<Terminal variant="animated" tabs={pagingTabs} {...props} />, { wrapper: ThemeProvider });
	};

	const rows = (screen: { container: HTMLElement }) => {
		return [...screen.container.querySelectorAll('p')].map((p) => {
			return p.textContent ?? '';
		});
	};

	const has = (screen: { container: HTMLElement }, text: string) => {
		return rows(screen).some((row) => {
			return row === text;
		});
	};

	const dispatchEnd = (element: Element | null | undefined) => {
		element?.dispatchEvent(new AnimationEvent('animationend', { bubbles: true }));
	};

	const clearLine = (screen: { container: HTMLElement }) => {
		return screen.container.querySelector<HTMLElement>('[data-clear-command] [class*="commandLine"]');
	};

	const selectedTab = (screen: { container: HTMLElement }) => {
		return screen.container.querySelector('button[role="tab"][aria-selected="true"]')?.textContent;
	};

	it('types one block, then clear, and keeps the next block out of the DOM', async () => {
		stubMotionOn();
		const screen = await renderPaged();

		await expect.element(screen.getByText('profile one')).toBeInTheDocument();

		expect(has(screen, '# One screen per profile')).toBe(true);
		expect(has(screen, 'cs config -n one')).toBe(true);
		expect(has(screen, 'profile one')).toBe(true);
		expect(has(screen, 'clear')).toBe(true);
		expect(has(screen, 'cs config -n two')).toBe(false);
		expect(has(screen, 'profile two')).toBe(false);
	});

	it('scrolls a command row into view as it appears, so a clear below the fold shows', async () => {
		stubMotionOn();
		const screen = await renderPaged();

		await expect.element(screen.getByText('profile one')).toBeInTheDocument();

		const panel = screen.container.querySelector<HTMLElement>('[role="tabpanel"]');
		const clearRow = screen.container.querySelector('[data-clear-command]');

		panel?.style.setProperty('height', '40px');
		clearRow?.dispatchEvent(new AnimationEvent('animationstart', { bubbles: true }));

		await expect
			.poll(
				() => {
					return panel?.scrollTop ?? 0;
				},
				{ timeout: 3000 }
			)
			.toBeGreaterThan(0);
	});

	it('wipes the screen when the clear command finishes typing', async () => {
		stubMotionOn();
		const screen = await renderPaged();

		await expect.element(screen.getByText('profile one')).toBeInTheDocument();

		dispatchEnd(clearLine(screen));

		await expect
			.poll(
				() => {
					return has(screen, 'cs config -n two');
				},
				{ timeout: 3000 }
			)
			.toBe(true);

		expect(has(screen, 'cs config -n one')).toBe(false);
		expect(has(screen, 'profile one')).toBe(false);
		expect(has(screen, 'clear')).toBe(false);
		expect(has(screen, '# One screen per profile')).toBe(true);
		expect(has(screen, 'profile two')).toBe(true);
	});

	it("keeps the tab's own screen off every page but the last", async () => {
		stubMotionOn();

		const screen = await renderPaged({
			tabs: [
				{
					...pagingTabs[0]!,
					screen: <p>final screen</p>
				},
				pagingTabs[1]!
			]
		});

		await expect.element(screen.getByText('profile one')).toBeInTheDocument();

		expect(has(screen, 'final screen')).toBe(false);

		dispatchEnd(clearLine(screen));

		await expect
			.poll(
				() => {
					return has(screen, 'final screen');
				},
				{ timeout: 3000 }
			)
			.toBe(true);
	});

	it("holds the cleared page for the tab's clearWait", async () => {
		stubMotionOn();

		const screen = await renderPaged({
			tabs: [
				{
					...pagingTabs[0]!,
					clearWait: 2000
				},
				pagingTabs[1]!
			]
		});

		await expect.element(screen.getByText('profile one')).toBeInTheDocument();

		dispatchEnd(clearLine(screen));

		await new Promise((resolve) => {
			setTimeout(resolve, 1300);
		});

		expect(has(screen, 'profile one')).toBe(true);

		await expect
			.poll(
				() => {
					return has(screen, 'cs config -n two');
				},
				{ timeout: 3000 }
			)
			.toBe(true);
	});

	it('never advances from a page before the last, and advances from the last one', async () => {
		stubMotionOn();
		const screen = await renderPaged();

		await expect.element(screen.getByText('profile one')).toBeInTheDocument();

		// The page's own output ending is not the replay's ending while a clear row still follows.
		const outputLine = [...screen.container.querySelectorAll('p')].find((p) => {
			return p.textContent === 'profile one';
		});

		dispatchEnd(outputLine);

		await new Promise((resolve) => {
			setTimeout(resolve, 400);
		});

		expect(selectedTab(screen)).toBe('one');

		// The clear command's typing end is what moves to the last page, which has no clear row.
		dispatchEnd(clearLine(screen));

		await expect
			.poll(
				() => {
					return has(screen, 'cs config -n two');
				},
				{ timeout: 3000 }
			)
			.toBe(true);

		expect(screen.container.querySelector('[data-clear-command]')).toBeNull();

		// The last page's last line ends the replay, as it does without paging.
		const end = screen.container.querySelector<HTMLElement>('[role="tabpanel"] > p:last-child');

		expect(end?.textContent).toContain('profile two');

		dispatchEnd(end);

		await expect
			.poll(
				() => {
					return selectedTab(screen);
				},
				{ timeout: 3000 }
			)
			.toBe('two');
	});

	it('returns to page 0 on a replay and on a tab switch', async () => {
		stubMotionOn();
		const screen = await renderPaged({ replay: true });

		dispatchEnd(clearLine(screen));

		await expect
			.poll(
				() => {
					return has(screen, 'cs config -n two');
				},
				{ timeout: 3000 }
			)
			.toBe(true);

		await screen.getByRole('button', { name: 'Replay the transcript' }).click();

		await expect
			.poll(
				() => {
					return has(screen, 'cs config -n one');
				},
				{ timeout: 3000 }
			)
			.toBe(true);

		expect(has(screen, 'cs config -n two')).toBe(false);
		expect(has(screen, 'clear')).toBe(true);

		dispatchEnd(clearLine(screen));

		await expect
			.poll(
				() => {
					return has(screen, 'cs config -n two');
				},
				{ timeout: 3000 }
			)
			.toBe(true);

		await screen.getByRole('tab', { name: 'two' }).click();
		await screen.getByRole('tab', { name: 'one' }).click();

		await expect
			.poll(
				() => {
					return has(screen, 'cs config -n one');
				},
				{ timeout: 3000 }
			)
			.toBe(true);

		expect(has(screen, 'cs config -n two')).toBe(false);
	});

	it('starts at page 0 again when the autoplay loop comes back around', async () => {
		stubMotionOn();

		const screen = await render(
			<Terminal
				variant="animated"
				tabs={[
					pagingTabs[0]!,
					{
						label: 'two',
						command: 'cs list',
						lines: ['Aliases:'],
						advance: 100
					}
				]}
			/>,
			{ wrapper: ThemeProvider }
		);

		await expect.element(screen.getByText('profile one')).toBeInTheDocument();

		dispatchEnd(clearLine(screen));

		await expect
			.poll(
				() => {
					return has(screen, 'cs config -n two');
				},
				{ timeout: 3000 }
			)
			.toBe(true);

		// The last page advances to tab two.
		const end = screen.container.querySelector<HTMLElement>('[role="tabpanel"] > p:last-child');

		expect(end?.textContent).toContain('profile two');

		dispatchEnd(end);

		await expect
			.poll(
				() => {
					return selectedTab(screen);
				},
				{ timeout: 3000 }
			)
			.toBe('two');

		// Tab two's own ending hands the window back to tab one, which starts over at page 0.
		const twoEnd = screen.container.querySelector<HTMLElement>('[role="tabpanel"] > p:last-child');

		expect(twoEnd?.textContent).toContain('Aliases:');

		dispatchEnd(twoEnd);

		await expect
			.poll(
				() => {
					return selectedTab(screen);
				},
				{ timeout: 3000 }
			)
			.toBe('one');

		await expect
			.poll(
				() => {
					return has(screen, 'cs config -n one');
				},
				{ timeout: 3000 }
			)
			.toBe(true);

		expect(has(screen, 'cs config -n two')).toBe(false);
		expect(has(screen, 'clear')).toBe(true);
	});

	it('keeps two blocks on one page, then the clear brings the next page', async () => {
		stubMotionOn();

		const screen = await render(
			<Terminal
				variant="animated"
				tabs={[
					{
						label: 'one',
						comment: 'Two runs, then the list',
						prompt: {
							dir: '~',
							git: false
						},
						command: 'cs config -n three',
						lines: ['profile three'],
						history: [
							{
								prompt: {
									dir: '~',
									git: false
								},
								command: 'cs config -n one',
								lines: ['profile one']
							},
							{
								prompt: {
									dir: '~',
									git: false
								},
								command: 'cs config -n two',
								lines: ['profile two'],
								clear: true
							}
						],
						advance: 100
					},
					{
						label: 'two',
						command: 'cs list',
						lines: ['Aliases:']
					}
				]}
			/>,
			{ wrapper: ThemeProvider }
		);

		await expect.element(screen.getByText('profile one')).toBeInTheDocument();

		// The first page holds both runs and their shared comment, then the typed clear.
		expect(has(screen, '# Two runs, then the list')).toBe(true);
		expect(has(screen, 'cs config -n one')).toBe(true);
		expect(has(screen, 'profile one')).toBe(true);
		expect(has(screen, 'cs config -n two')).toBe(true);
		expect(has(screen, 'profile two')).toBe(true);
		expect(has(screen, 'clear')).toBe(true);
		expect(has(screen, 'cs config -n three')).toBe(false);
		expect(has(screen, 'profile three')).toBe(false);

		dispatchEnd(clearLine(screen));

		await expect
			.poll(
				() => {
					return has(screen, 'cs config -n three');
				},
				{ timeout: 3000 }
			)
			.toBe(true);

		expect(has(screen, 'cs config -n one')).toBe(false);
		expect(has(screen, 'profile two')).toBe(false);
		expect(has(screen, 'clear')).toBe(false);
		expect(has(screen, '# Two runs, then the list')).toBe(true);
		expect(has(screen, 'profile three')).toBe(true);
	});

	it('keeps the whole transcript without clear rows outside the animated paging', async () => {
		// The suite's own reduced motion is left in place, so paging never engages here.
		const reduced = await renderPaged();

		await expect.element(reduced.getByText('profile one')).toBeInTheDocument();

		expect(has(reduced, 'cs config -n one')).toBe(true);
		expect(has(reduced, 'cs config -n two')).toBe(true);
		expect(has(reduced, 'profile two')).toBe(true);
		expect(has(reduced, 'clear')).toBe(false);

		// The static variant ignores the flag for the same reason.
		const staticScreen = await render(<Terminal variant="static" tabs={pagingTabs} />, {
			wrapper: ThemeProvider
		});

		expect(has(staticScreen, 'cs config -n one')).toBe(true);
		expect(has(staticScreen, 'cs config -n two')).toBe(true);
		expect(has(staticScreen, 'clear')).toBe(false);
	});
});

describe('a history entry with its own comment', () => {
	it("shows the comment right under that command's output", async () => {
		const screen = await render(
			<Terminal
				variant="animated"
				tabs={[
					{
						label: 'alias',
						history: [
							{
								comment: 'Use claude-planner to plan',
								command: 'cs alias planner claude',
								lines: ['Alias "planner" created at profile "claude".']
							}
						],
						command: 'cs ls',
						lines: []
					}
				]}
			/>,
			{ wrapper: ThemeProvider }
		);

		const comment = screen.getByText('# Use claude-planner to plan');

		await expect.element(comment).toBeInTheDocument();

		const previous = comment.element().previousElementSibling;

		expect(previous?.textContent).toBe('Alias "planner" created at profile "claude".');
	});
});

describe('a history entry with its own screen', () => {
	const screenTabs = [
		{
			label: 'one',
			history: [
				{
					command: 'prog',
					screen: <div data-entry-screen="one">the screen</div>,
					screenMs: 500
				},
				{
					command: 'next',
					lines: ['next output']
				}
			],
			command: 'last',
			lines: []
		}
	];

	const panelChildren = (screen: { container: HTMLElement }) => {
		return [...(screen.container.querySelector('[role="tabpanel"]')?.children ?? [])] as HTMLElement[];
	};

	const commandRowIndex = (children: HTMLElement[], command: string) => {
		return children.findIndex((child) => {
			return child.className.includes('commandRow') && (child.textContent ?? '').includes(command);
		});
	};

	it('renders the screen after its command row, before the next command', async () => {
		const screen = await render(<Terminal variant="animated" tabs={screenTabs} />, { wrapper: ThemeProvider });

		await expect.element(screen.getByText('the screen')).toBeInTheDocument();

		const children = panelChildren(screen);
		const progRow = commandRowIndex(children, 'prog');

		const screenIndex = children.findIndex((child) => {
			return child.querySelector('[data-entry-screen]');
		});

		const nextRow = commandRowIndex(children, 'next');

		expect(progRow).toBeGreaterThan(-1);
		expect(screenIndex).toBe(progRow + 1);
		expect(nextRow).toBeGreaterThan(screenIndex);

		// Only the tab-level screen marks the advance gate; an entry screen never does.
		expect(screen.container.querySelector('[data-reveal-end]')).toBeNull();
	});

	it('hands the caret from the command to the screen, and from the screen to the next command', async () => {
		const screen = await render(<Terminal variant="animated" tabs={screenTabs} />, { wrapper: ThemeProvider });

		await expect.element(screen.getByText('the screen')).toBeInTheDocument();

		const children = panelChildren(screen);
		const typedLines = [...screen.container.querySelectorAll<HTMLElement>('[data-last-line="true"]')];

		const progLine = typedLines.find((line) => {
			return line.textContent === 'prog';
		});

		const wrapper = screen.container.querySelector<HTMLElement>('[data-entry-screen]')?.parentElement;
		const nextRow = children[commandRowIndex(children, 'next')];

		expect(progLine?.style.getPropertyValue('--caret-until')).toBe(wrapper?.style.getPropertyValue('--at'));
		expect(wrapper?.style.getPropertyValue('--caret-until')).toBe(nextRow?.style.getPropertyValue('--at'));
	});

	it('leaves no blank spacer between blocks when the tab sets gap false', async () => {
		const screen = await render(
			<Terminal
				variant="animated"
				tabs={[
					{
						label: 'one',
						gap: false,
						command: 'last',
						lines: [],
						history: [
							{
								command: 'prog',
								screen: <div data-entry-screen="one">the screen</div>,
								screenMs: 500
							}
						]
					}
				]}
			/>,
			{ wrapper: ThemeProvider }
		);

		await expect.element(screen.getByText('the screen')).toBeInTheDocument();

		const blanks = [...screen.container.querySelectorAll('p')].filter((p) => {
			return p.textContent === ' ';
		});

		expect(blanks.length).toBe(0);
	});

	it('splits the page after an entry screen: clear follows the screen, then the next page', async () => {
		const real = window.matchMedia.bind(window);

		vi.stubGlobal(
			'matchMedia',
			vi.fn((query: string) => {
				return query === '(prefers-reduced-motion: reduce)'
					? ({
							matches: false,
							media: query
						} as MediaQueryList)
					: real(query);
			})
		);

		try {
			const screen = await render(
				<Terminal
					variant="animated"
					tabs={[
						{
							label: 'one',
							history: [
								{
									command: 'prog',
									screen: <div data-entry-screen="one">the screen</div>,
									screenMs: 100,
									clear: true
								}
							],
							command: 'after',
							lines: ['after output'],
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

			await expect.element(screen.getByText('the screen')).toBeInTheDocument();

			const children = panelChildren(screen);

			const screenIndex = children.findIndex((child) => {
				return child.querySelector('[data-entry-screen]');
			});

			const clearIndex = children.findIndex((child) => {
				return child.hasAttribute('data-clear-command');
			});

			expect(clearIndex).toBeGreaterThan(screenIndex);
			expect(screen.container.textContent?.includes('after output')).toBe(false);

			const clearLine = screen.container.querySelector<HTMLElement>('[data-clear-command] [class*="commandLine"]');

			clearLine?.dispatchEvent(new AnimationEvent('animationend', { bubbles: true }));

			await expect
				.poll(
					() => {
						return screen.container.textContent?.includes('after output');
					},
					{ timeout: 3000 }
				)
				.toBe(true);
		} finally {
			vi.unstubAllGlobals();
		}
	});
});

describe('the play/pause control', () => {
	const pauseTabs = [
		{
			label: 'one',
			command: 'cs use claude',
			lines: ['Switched to profile "claude".'],
			advance: 2000
		},
		{
			label: 'two',
			command: 'cs list',
			lines: []
		}
	];

	const renderPause = async (props = {}) => {
		return await render(<Terminal variant="animated" replay tabs={pauseTabs} {...props} />, {
			wrapper: ThemeProvider
		});
	};

	const rootElement = (screen: { container: HTMLElement }) => {
		return screen.container.firstElementChild as HTMLElement;
	};

	const selectedTab = (screen: { container: HTMLElement }) => {
		return screen.container.querySelector('button[role="tab"][aria-selected="true"]')?.textContent;
	};

	// The suite runs under prefers-reduced-motion, so this is the reduced-motion case itself.
	it('renders next to replay under reduced motion, with pause to the left of replay', async () => {
		const screen = await renderPause();

		const buttons = [...rootElement(screen).querySelectorAll('button')];

		const pause = buttons.findIndex((button) => {
			return button.getAttribute('aria-label') === 'Pause the transcript';
		});

		const replay = buttons.findIndex((button) => {
			return button.getAttribute('aria-label') === 'Replay the transcript';
		});

		expect(pause).toBeGreaterThan(-1);
		expect(replay).toBeGreaterThan(pause);
	});

	it('flips its label and the root data-paused as it toggles', async () => {
		const screen = await renderPause();

		expect(rootElement(screen).getAttribute('data-paused')).toBe('false');

		await screen.getByRole('button', { name: 'Pause the transcript' }).click();

		await expect.element(screen.getByRole('button', { name: 'Play the transcript' })).toBeInTheDocument();
		expect(rootElement(screen).getAttribute('data-paused')).toBe('true');

		await screen.getByRole('button', { name: 'Play the transcript' }).click();

		await expect.element(screen.getByRole('button', { name: 'Pause the transcript' })).toBeInTheDocument();
		expect(rootElement(screen).getAttribute('data-paused')).toBe('false');
	});

	it('a replay while paused plays again', async () => {
		const screen = await renderPause();

		await screen.getByRole('button', { name: 'Pause the transcript' }).click();
		await expect.element(screen.getByRole('button', { name: 'Play the transcript' })).toBeInTheDocument();

		await screen.getByRole('button', { name: 'Replay the transcript' }).click();

		await expect.element(screen.getByRole('button', { name: 'Pause the transcript' })).toBeInTheDocument();
		expect(rootElement(screen).getAttribute('data-paused')).toBe('false');
	});

	it('a tab pick while paused plays again', async () => {
		const screen = await renderPause();

		await screen.getByRole('button', { name: 'Pause the transcript' }).click();

		await screen.getByRole('tab', { name: 'two' }).click();

		await expect.element(screen.getByRole('button', { name: 'Pause the transcript' })).toBeInTheDocument();
		expect(rootElement(screen).getAttribute('data-paused')).toBe('false');
	});

	it('pausing during the advance wait holds the tab, and play finishes the wait', async () => {
		const screen = await renderPause();

		await expect.element(screen.getByText('Switched to profile "claude".')).toBeInTheDocument();

		const end = screen.container.querySelector<HTMLElement>('[role="tabpanel"] > p:last-child');

		end?.dispatchEvent(new AnimationEvent('animationend', { bubbles: true }));

		await screen.getByRole('button', { name: 'Pause the transcript' }).click();

		await new Promise((resolve) => {
			setTimeout(resolve, 1000);
		});

		expect(selectedTab(screen)).toBe('one');

		await screen.getByRole('button', { name: 'Play the transcript' }).click();

		await expect
			.poll(
				() => {
					return selectedTab(screen);
				},
				{ timeout: 3000 }
			)
			.toBe('two');
	});
});

describe('pausing the paging and the screens', () => {
	/*
	 * The suite runs under prefers-reduced-motion: the stub answers the component's query with "no
	 * preference" so paging engages, while the real reduced motion keeps the animations off and the
	 * animationend events the test's to dispatch.
	 */
	const stubMotionOn = () => {
		const real = window.matchMedia.bind(window);

		vi.stubGlobal(
			'matchMedia',
			vi.fn((query: string) => {
				return query === '(prefers-reduced-motion: reduce)'
					? ({
							matches: false,
							media: query
						} as MediaQueryList)
					: real(query);
			})
		);
	};

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('pausing during the clear wait holds the page, and play finishes the wait', async () => {
		stubMotionOn();

		const screen = await render(
			<Terminal
				variant="animated"
				replay
				tabs={[
					{
						label: 'one',
						prompt: {
							dir: '~',
							git: false
						},
						command: 'cs config -n two',
						lines: ['profile two'],
						history: [
							{
								prompt: {
									dir: '~',
									git: false
								},
								command: 'cs config -n one',
								lines: ['profile one'],
								clear: true
							}
						],
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

		await expect.element(screen.getByText('profile one')).toBeInTheDocument();

		const clearRow = screen.container.querySelector<HTMLElement>('[data-clear-command] [class*="commandLine"]');

		clearRow?.dispatchEvent(new AnimationEvent('animationend', { bubbles: true }));

		await screen.getByRole('button', { name: 'Pause the transcript' }).click();

		await new Promise((resolve) => {
			setTimeout(resolve, 1300);
		});

		expect(screen.container.textContent).toContain('profile one');
		expect(screen.container.textContent).not.toContain('cs config -n two');

		await screen.getByRole('button', { name: 'Play the transcript' }).click();

		await expect
			.poll(
				() => {
					return screen.container.textContent?.includes('cs config -n two');
				},
				{ timeout: 3000 }
			)
			.toBe(true);
	});

	it('a program screen inside a paused root has its animations paused', async () => {
		const screen = await render(
			<Terminal
				variant="animated"
				replay
				tabs={[
					{
						label: 'one',
						command: 'cs use claude',
						lines: [],
						screen: <div data-screen-probe>the screen</div>
					}
				]}
			/>,
			{ wrapper: ThemeProvider }
		);

		await expect.element(screen.getByText('the screen')).toBeInTheDocument();

		const wrapper = screen.container.querySelector('[data-screen-probe]')?.parentElement;

		expect(wrapper).toBeTruthy();
		expect(getComputedStyle(wrapper!).animationPlayState).toBe('running');

		await screen.getByRole('button', { name: 'Pause the transcript' }).click();

		expect(getComputedStyle(wrapper!).animationPlayState).toBe('paused');
	});
});
