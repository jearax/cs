import { cn } from '@jjuidev/styles/variants';
import { Pause, Play, RotateCcw } from 'lucide-react';
import {
	AnimationEvent,
	Fragment,
	ComponentProps,
	CSSProperties,
	KeyboardEvent,
	useEffect,
	useId,
	ReactNode,
	useRef,
	useState
} from 'react';

import CopyButton from '@/components/CopyButton/CopyButton';
import ShellCommand from '@/components/ShellCommand/ShellCommand';
import ShellPrompt, { ShellPromptProps } from '@/components/ShellPrompt/ShellPrompt';
import { parseAnsi } from '@/components/Terminal/ansi.util';
import usePausableTimeout from '@/components/Terminal/pausable-timeout';
import WindowChrome from '@/components/WindowChrome/WindowChrome';

import styles from './styles.module.css';

export type TerminalHistoryEntry = {
	/** Where the command runs, when it is not inside the project. */
	prompt?: Pick<ShellPromptProps, 'dir' | 'git'>;
	command: string;
	/** A shell comment shown under the command's output: how to use what it just made. */
	comment?: string;
	/** The command's own output, shown before the next command starts. */
	lines?: readonly string[];
	/**
	 * A typed `clear` follows this entry's output and wipes the screen before the next entry: the
	 * entries up to and including it form one page.
	 */
	clear?: boolean;
	/** A full-screen program's view, shown after the command instead of output lines. */
	screen?: ReactNode;
	/** Milliseconds the screen runs before the shell resumes; the next command starts after it. */
	screenMs?: number;
};

export type TerminalTab = {
	label: string;
	/** The shell comment the transcript opens with: the tab's purpose, in the terminal's own voice. */
	comment?: string;
	command?: string;
	/** Where the command runs, when it is not inside the project. */
	prompt?: Pick<ShellPromptProps, 'dir' | 'git'>;
	/** Commands already run in this window; an entry's `lines` are its own output, shown before the next command starts. */
	history?: readonly TerminalHistoryEntry[];
	lines?: readonly string[];
	/** A full-screen program's view, shown after the command instead of output lines. */
	screen?: ReactNode;
	/** Milliseconds a finished replay stays on screen before the window moves to the next tab. */
	advance?: number;
	/** Milliseconds a typed `clear` waits before the next page; one second when unset. */
	clearWait?: number;
	/** A blank line between blocks; off for a transcript that reads as one continuous session. */
	gap?: boolean;
};

export type TerminalProps = ComponentProps<'div'> & {
	/** The window's title: the command, or the folder the terminal sits in. */
	title?: string;
	/** A note on the right of the title bar, for a transcript that is an example, not a promise. */
	label?: string;
	command?: string;
	/** The shell comment above the command, for a window with a single transcript. */
	comment?: string;
	/** The CLI's output, one string per line, with its real glyphs. */
	lines?: readonly string[];
	/** Commands already run in this window, for a single-transcript window. */
	history?: readonly TerminalHistoryEntry[];
	tabs?: readonly TerminalTab[];
	tabListLabel?: string;
	/** `animated` types the command and reveals the output; `static` shows the final state. */
	variant?: 'static' | 'animated';
	/** Shows a replay control; the animated variant only, the static one is already finished. */
	replay?: boolean;
	/** Pins the body to a fixed height at the desktop so switching tabs never shifts the page. */
	fixedBody?: boolean;
	/**
	 * Puts an icon-only copy button at the right end of the command row, copying the shown
	 * command. The interaction follows the design system's `ButtonCopy` with `feedback="icon"`:
	 * the icon swaps Copy→Check for two seconds, and a screen-reader line says so.
	 */
	commandCopy?: boolean;
};

const Terminal = ({
	className,
	title,
	label,
	command,
	comment,
	lines,
	history,
	tabs,
	tabListLabel = 'Replay transcripts',
	variant = 'static',
	replay = false,
	fixedBody = false,
	commandCopy = false,
	...props
}: TerminalProps) => {
	const [active, setActive] = useState(0);
	const [run, setRun] = useState(0);
	const [paused, setPaused] = useState(false);
	const baseId = useId();
	const tab = tabs?.[active];
	const shownCommand = tab?.command ?? command;
	const shownComment = tab?.comment ?? comment;
	const shownLines = tab?.lines ?? lines ?? [];

	/*
	 * The transcript is one interleaved document: each command is followed by its own output, then
	 * a blank line, then the next command. The final command (the tab's `command` + `lines`) is
	 * the last block.
	 */
	const blocks: {
		prompt: Pick<ShellPromptProps, 'dir' | 'git'> | undefined;
		command: string;
		comment: string | undefined;
		lines: readonly string[];
		clear: boolean;
		screen: ReactNode | undefined;
		screenMs: number;
	}[] = [
		...(tab?.history ?? history ?? []).map((entry) => {
			return {
				prompt: entry.prompt,
				command: entry.command,
				comment: entry.comment,
				lines: entry.lines ?? [],
				clear: entry.clear === true,
				screen: entry.screen,
				screenMs: entry.screenMs ?? 0
			};
		}),
		...(shownCommand || (!tab?.history?.length && shownLines.length)
			? [
					{
						prompt: tab?.prompt,
						command: shownCommand ?? '',
						comment: undefined,
						lines: shownLines,
						clear: false,
						screen: undefined,
						screenMs: 0
					}
				]
			: [])
	];

	// A transcript that reads as one session leaves out the blank line between blocks.
	const gap = tab?.gap !== false;

	// Paging keeps its own page. Every place that switches the tab or replays resets it to 0 in the
	// same batch of updates, so a page beyond the new tab's page count never paints.
	const [page, setPage] = useState(0);

	// A page ends with a typed `clear`, whose wipe waits a second (or the tab's `clearWait`) before the next
	// page; reduced motion keeps the whole transcript.
	const CLEAR_MS = 1000;

	const reducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	const paging =
		variant === 'animated' &&
		blocks.some((block) => {
			return block.clear;
		}) &&
		!reducedMotion;

	// A page is the blocks up to and including each `clear` block; whatever follows the last clear
	// is the final page, with no clear row.
	const pages: number[][] = [[]];

	for (const [index, block] of blocks.entries()) {
		pages[pages.length - 1]!.push(index);

		if (block.clear) {
			pages.push([]);
		}
	}

	if (pages[pages.length - 1]!.length === 0) {
		pages.pop();
	}

	const pageIsLast = page >= pages.length - 1;

	// The `clear` command reuses the cleared block's prompt; computing it as one more block gives
	// the wipe the same pacing rhythm as the transcript. Outside paging the whole transcript plays
	// at once.
	const pageBlocks = !paging
		? blocks
		: [
				...(pages[page] ?? []).map((index) => {
					return blocks[index]!;
				}),
				...(pageIsLast
					? []
					: [
							{
								prompt: blocks[pages[page]!.at(-1)!]!.prompt,
								command: 'clear',
								comment: undefined,
								lines: [] as readonly string[],
								clear: false,
								screen: undefined,
								screenMs: 0
							}
						])
			];

	/*
	 * One cumulative timeline, in milliseconds. A block types its command (700ms), waits a beat,
	 * reveals its lines (70ms a line), then pauses before the next block. A block with a `screen`
	 * shows the screen instead of its lines and holds it for `screenMs` before the shell resumes.
	 * The values land on the elements as `--at`; the CSS animation-delay does the pacing, so there
	 * is no JS timer in the reveal and the single-timeline behaviour is unchanged.
	 */
	const TYPE_MS = 700;
	const LINE_MS = 70;
	const FIRST_LINE_LAG_MS = 150;
	const GAP_MS = 1300;
	// A command's own comment follows its output after this beat.
	const COMMENT_LAG_MS = 300;

	let cursor = 0;

	const timeline = pageBlocks.map((block) => {
		const at = cursor;

		// A typed command may be several physical lines (a shell continuation); each line takes a
		// typing step of its own.
		const physicalLines = block.command.split('\n');
		const lineEnd = at + physicalLines.length * TYPE_MS;

		if (block.screen) {
			const screenAt = lineEnd + FIRST_LINE_LAG_MS;

			cursor = screenAt + block.screenMs + GAP_MS;

			return {
				block,
				commentAt: screenAt,
				at,
				physicalLines,
				lineEnd,
				linesAt: [] as number[],
				screenAt,
				spacerAt: screenAt + block.screenMs
			};
		}

		const linesAt = block.lines.map((_, index) => {
			return lineEnd + FIRST_LINE_LAG_MS + index * LINE_MS;
		});

		const outputEnd = lineEnd + FIRST_LINE_LAG_MS + block.lines.length * LINE_MS;
		const commentAt = outputEnd + COMMENT_LAG_MS;

		cursor = (block.comment ? commentAt : outputEnd) + GAP_MS;

		return {
			block,
			commentAt,
			at,
			physicalLines,
			lineEnd,
			linesAt,
			screenAt: undefined,
			spacerAt: linesAt[linesAt.length - 1] ?? at + TYPE_MS
		};
	});

	const endAt = timeline.length
		? timeline[timeline.length - 1]!.at +
			TYPE_MS +
			FIRST_LINE_LAG_MS +
			timeline[timeline.length - 1]!.block.lines.length * LINE_MS
		: 0;

	const body = useRef<HTMLDivElement>(null);

	// A replay starts at the top; under reduced motion it is already finished, so it shows the end.
	useEffect(() => {
		const element = body.current;

		if (element === null || variant !== 'animated') {
			return;
		}

		const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

		element.scrollTop = reduced ? element.scrollHeight : 0;
	}, [variant, run, active, page]);

	const advanceTimer = usePausableTimeout();
	const clearTimer = usePausableTimeout();

	// A tab switch, a replay or a page change cancels the pending moves, so a reader's own choice always wins.
	useEffect(() => {
		return () => {
			advanceTimer.clear();
			clearTimer.clear();
		};
	}, [active, run, page, advanceTimer, clearTimer]);

	// Pausing freezes the pending waits where they stand; playing picks up the remainders.
	useEffect(() => {
		if (paused) {
			advanceTimer.pause();
			clearTimer.pause();
		} else {
			advanceTimer.resume();
			clearTimer.resume();
		}
	}, [paused, advanceTimer, clearTimer]);

	// The last line's reveal ending is the replay ending; under reduced motion nothing animates, so nothing moves.
	// The tabs loop for good: a reader's pick replays that tab, then the loop carries on from it.
	const onRevealEnd = (event: AnimationEvent<HTMLDivElement>) => {
		const count = tabs?.length ?? 0;

		// A program screen that keeps drawing after it appears marks its own last part.
		const end = body.current?.querySelector('[data-reveal-end]') ?? body.current?.lastElementChild;

		if (tab?.advance === undefined || count < 2 || event.target !== end) {
			return;
		}

		advanceTimer.start(() => {
			setPage(0);
			setActive((current) => {
				return (current + 1) % count;
			});
		}, tab.advance);
	};

	const onAnimationEnd = (event: AnimationEvent<HTMLDivElement>) => {
		const target = event.target;

		// The clear command's own typing (not the caret's infinite loop on the pseudo-element) ends
		// the page: after a short lag the screen wipes by advancing to the next page.
		if (
			paging &&
			!event.nativeEvent.pseudoElement &&
			target instanceof HTMLElement &&
			target.classList.contains(styles.commandLine ?? '') &&
			target.closest('[data-clear-command]')
		) {
			clearTimer.start(() => {
				setPage(page + 1);
			}, tab?.clearWait ?? CLEAR_MS);
			return;
		}

		// Pages before the last never move the tab on; only the last page's own ending may.
		if (paging && !pageIsLast) {
			return;
		}

		onRevealEnd(event);
	};

	// A program screen grows while it runs; the window stays at its bottom, as a terminal does. A
	// screen still waiting for its turn already takes its height, so it is skipped until it shows.
	useEffect(() => {
		const element = body.current;
		const screens = element?.querySelectorAll(`.${styles.screen ?? ''}`);

		if (!element || !screens?.length) {
			return;
		}

		const observer = new ResizeObserver((entries) => {
			const showing = entries.some((entry) => {
				return getComputedStyle(entry.target).opacity !== '0';
			});

			if (showing && element.scrollHeight > element.clientHeight) {
				element.scrollTop = element.scrollHeight;
			}
		});

		screens.forEach((screen) => {
			observer.observe(screen);
		});

		return () => {
			observer.disconnect();
		};
	}, [active, run, page]);

	// Follows the output like a real terminal: each output line or command row that starts to appear is scrolled into view.
	const onLineAppear = (event: AnimationEvent<HTMLDivElement>) => {
		const element = body.current;
		const line = event.target;

		const followed = [styles.line, styles.commandRow, styles.comment].some((name) => {
			return name !== undefined && line instanceof HTMLElement && line.classList.contains(name);
		});

		if (element === null || !(line instanceof HTMLElement) || !followed) {
			return;
		}

		const padding = Number.parseFloat(getComputedStyle(element).paddingBottom);
		const bottom = line.offsetTop + line.offsetHeight + padding - element.clientHeight;

		if (bottom > element.scrollTop) {
			element.scrollTo({
				top: bottom,
				behavior: 'smooth'
			});
		}
	};

	const panelProps = tabs && {
		role: 'tabpanel',
		id: `${baseId}-panel-${active}`,
		'aria-labelledby': `${baseId}-tab-${active}`
	};

	const onTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
		const last = (tabs?.length ?? 0) - 1;
		let next = index;

		if (event.key === 'ArrowRight') {
			next = index === last ? 0 : index + 1;
		} else if (event.key === 'ArrowLeft') {
			next = index === 0 ? last : index - 1;
		} else if (event.key === 'Home') {
			next = 0;
		} else if (event.key === 'End') {
			next = last;
		} else {
			return;
		}

		event.preventDefault();
		setPage(0);
		setActive(next);
		setPaused(false);
		document.getElementById(`${baseId}-tab-${next}`)?.focus();
	};

	return (
		<div
			className={cn(styles.root, className)}
			data-variant={variant}
			data-fixed-body={fixedBody}
			data-paused={paused}
			{...props}
		>
			<WindowChrome title={title}>{label && <span className={styles.label}>{label}</span>}</WindowChrome>

			{tabs && (
				<div className={styles.tabs} role="tablist" aria-label={tabListLabel}>
					{tabs.map((item, index) => {
						return (
							<button
								key={`${index}-${item.label}`}
								type="button"
								role="tab"
								id={`${baseId}-tab-${index}`}
								aria-selected={index === active}
								aria-controls={`${baseId}-panel-${index}`}
								tabIndex={index === active ? 0 : -1}
								className={styles.tab}
								data-selected={index === active}
								onClick={() => {
									setPage(0);
									setActive(index);
									setPaused(false);
									setRun((run) => {
										return run + 1;
									});
								}}
								onKeyDown={(event) => {
									onTabKeyDown(event, index);
								}}
							>
								{item.label}
							</button>
						);
					})}
					{replay && variant === 'animated' ? (
						<>
							<button
								type="button"
								className={styles.pause}
								aria-label={paused ? 'Play the transcript' : 'Pause the transcript'}
								onClick={() => {
									setPaused((current) => {
										return !current;
									});
								}}
							>
								{paused ? (
									<Play className={styles.replayIcon} size={13} aria-hidden="true" />
								) : (
									<Pause className={styles.replayIcon} size={13} aria-hidden="true" />
								)}
							</button>
							<button
								type="button"
								className={styles.replay}
								aria-label="Replay the transcript"
								onClick={() => {
									setPage(0);
									setPaused(false);
									setRun((run) => {
										return run + 1;
									});
								}}
							>
								<RotateCcw className={styles.replayIcon} size={13} aria-hidden="true" />
							</button>
						</>
					) : null}
				</div>
			)}

			<div
				ref={body}
				className={styles.body}
				style={{ '--end-at': endAt } as CSSProperties}
				onAnimationStart={onLineAppear}
				onAnimationEnd={onAnimationEnd}
				{...panelProps}
			>
				{shownComment && (
					<p key={`${run}-${page}-${shownComment}`} className={styles.comment}>
						{`# ${shownComment}`}
					</p>
				)}
				{timeline.map(({ block, commentAt, at, physicalLines, linesAt, screenAt, spacerAt }, blockIndex) => {
					const last = blockIndex === timeline.length - 1;
					const nextAt = timeline[blockIndex + 1]?.at;
					const isClearRow = paging && !pageIsLast && last;

					// A command followed by a screen hands the caret to the screen when it appears;
					// the last command hands it to the tab-level screen, if the tab has one.
					const caretUntil = block.screen ? screenAt : (nextAt ?? (last && tab?.screen ? endAt : undefined));

					return (
						<Fragment key={`${run}-${active}-${page}-${blockIndex}`}>
							{block.command && (
								<div
									className={styles.commandRow}
									style={{ '--at': at } as CSSProperties}
									{...(isClearRow ? { 'data-clear-command': true } : {})}
								>
									<ShellPrompt className={styles.prompt} {...block.prompt} />
									{/*
									 * One element per physical line, so a shell continuation types line by
									 * line; the copy value stays the one logical command.
									 */}
									<p className={styles.command} data-last={last}>
										{physicalLines.map((line, index) => {
											const lastLine = index === physicalLines.length - 1;

											return (
												<span
													key={`${run}-${active}-${page}-${blockIndex}-${index}`}
													className={styles.commandLine}
													data-last-line={lastLine}
													data-caret-off={lastLine && caretUntil !== undefined ? true : undefined}
													style={
														{
															'--chars': line.length,
															'--at': at + index * TYPE_MS,
															...(lastLine && caretUntil !== undefined ? { '--caret-until': caretUntil } : {})
														} as CSSProperties
													}
												>
													<ShellCommand command={line} />
												</span>
											);
										})}
									</p>
									{commandCopy && last && (
										<CopyButton
											className={styles.commandCopy}
											feedback="icon"
											label="Copy the command"
											value={block.command.replace(/\\\n/g, '')}
										/>
									)}
								</div>
							)}
							{block.screen ? (
								<div
									className={cn(styles.line, styles.screen)}
									style={
										{
											'--at': screenAt,
											// The screen's own caret goes out when the next command row appears.
											...(nextAt !== undefined ? { '--caret-until': nextAt } : {})
										} as CSSProperties
									}
								>
									{block.screen}
								</div>
							) : (
								<>
									{block.lines.map((line, index) => {
										return (
											<p
												key={`${run}-${active}-${page}-${blockIndex}-${index}-${line}`}
												className={styles.line}
												style={{ '--at': linesAt[index] } as CSSProperties}
											>
												{parseAnsi(line).map((segment, segmentIndex) => {
													return (
														<span
															key={segmentIndex}
															className={styles.segment}
															data-color={segment.color}
															data-dim={segment.dim}
															data-bold={segment.bold}
															data-inverse={segment.inverse}
														>
															{segment.text}
														</span>
													);
												})}
											</p>
										);
									})}
									{block.comment && (
										<p className={styles.comment} style={{ '--at': commentAt } as CSSProperties}>
											{`# ${block.comment}`}
										</p>
									)}
								</>
							)}
							{gap && !last && (
								<p className={styles.line} style={{ '--at': spacerAt } as CSSProperties}>
									{' '}
								</p>
							)}
						</Fragment>
					);
				})}
				{/* The tab's own screen closes the transcript, so a paged tab shows it on the last page only. */}
				{tab?.screen && (!paging || pageIsLast) && (
					<div
						key={`${run}-${active}-screen`}
						className={cn(styles.line, styles.screen)}
						style={{ '--at': endAt } as CSSProperties}
						/* The wrapper is stable across the screen's own remounts, so the advance gate
						   fires here and not on a node the screen may have swapped out. */
						data-reveal-end
					>
						{tab.screen}
					</div>
				)}
			</div>
		</div>
	);
};

export default Terminal;
