import { cn } from '@jjuidev/styles/variants';
import { RotateCcw } from 'lucide-react';
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
import WindowChrome from '@/components/WindowChrome/WindowChrome';

import styles from './styles.module.css';

export type TerminalHistoryEntry = {
	/** Where the command runs, when it is not inside the project. */
	prompt?: Pick<ShellPromptProps, 'dir' | 'git'>;
	command: string;
	/** The command's own output, shown before the next command starts. */
	lines?: readonly string[];
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
		lines: readonly string[];
	}[] = [
		...(tab?.history ?? history ?? []).map((entry) => {
			return {
				prompt: entry.prompt,
				command: entry.command,
				lines: entry.lines ?? []
			};
		}),
		...(shownCommand || (!tab?.history?.length && shownLines.length)
			? [
					{
						prompt: tab?.prompt,
						command: shownCommand ?? '',
						lines: shownLines
					}
				]
			: [])
	];

	/*
	 * One cumulative timeline, in milliseconds. A block types its command (700ms), waits a beat,
	 * reveals its lines (70ms a line), then pauses before the next block. The values land on the
	 * elements as `--at`; the CSS animation-delay does the pacing, so there is no JS timer in the
	 * reveal and the single-timeline behaviour is unchanged.
	 */
	const TYPE_MS = 700;
	const LINE_MS = 70;
	const FIRST_LINE_LAG_MS = 150;
	const GAP_MS = 1300;

	let cursor = 0;

	const timeline = blocks.map((block) => {
		const at = cursor;

		const linesAt = block.lines.map((_, index) => {
			return at + TYPE_MS + FIRST_LINE_LAG_MS + index * LINE_MS;
		});

		cursor = at + TYPE_MS + FIRST_LINE_LAG_MS + block.lines.length * LINE_MS + GAP_MS;

		return {
			block,
			at,
			linesAt
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
	}, [variant, run, active]);

	const advanceTimer = useRef<number | undefined>(undefined);
	// The tabs play on in a loop until the reader picks one; from then on the window stays where they put it.
	const autoplay = useRef(true);

	// A tab switch or a replay cancels the pending move, so a reader's own choice always wins.
	useEffect(() => {
		return () => {
			window.clearTimeout(advanceTimer.current);
		};
	}, [active, run]);

	// The last line's reveal ending is the replay ending; under reduced motion nothing animates, so nothing moves.
	const onRevealEnd = (event: AnimationEvent<HTMLDivElement>) => {
		const count = tabs?.length ?? 0;

		// A program screen that keeps drawing after it appears marks its own last part.
		const end = body.current?.querySelector('[data-reveal-end]') ?? body.current?.lastElementChild;

		if (tab?.advance === undefined || !autoplay.current || count < 2 || event.target !== end) {
			return;
		}

		advanceTimer.current = window.setTimeout(() => {
			setActive((current) => {
				return (current + 1) % count;
			});
		}, tab.advance);
	};

	// A program screen grows while it runs; the window stays at its bottom, as a terminal does.
	useEffect(() => {
		const element = body.current;
		const screen = element?.querySelector(`.${styles.screen ?? ''}`);

		if (!element || !screen) {
			return;
		}

		const observer = new ResizeObserver(() => {
			if (element.scrollHeight > element.clientHeight) {
				element.scrollTop = element.scrollHeight;
			}
		});

		observer.observe(screen);

		return () => {
			observer.disconnect();
		};
	}, [active, run]);

	// Follows the output like a real terminal: each line that starts to appear is scrolled into view.
	const onLineAppear = (event: AnimationEvent<HTMLDivElement>) => {
		const element = body.current;
		const line = event.target;

		if (element === null || !(line instanceof HTMLElement) || !line.classList.contains(styles.line ?? '')) {
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
		autoplay.current = false;
		setActive(next);
		document.getElementById(`${baseId}-tab-${next}`)?.focus();
	};

	return (
		<div className={cn(styles.root, className)} data-variant={variant} data-fixed-body={fixedBody} {...props}>
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
									autoplay.current = false;
									setActive(index);
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
						<button
							type="button"
							className={styles.replay}
							aria-label="Replay the transcript"
							onClick={() => {
								setRun((run) => {
									return run + 1;
								});
							}}
						>
							<RotateCcw className={styles.replayIcon} size={13} aria-hidden="true" />
						</button>
					) : null}
				</div>
			)}

			<div
				ref={body}
				className={styles.body}
				style={{ '--end-at': endAt } as CSSProperties}
				onAnimationStart={onLineAppear}
				onAnimationEnd={onRevealEnd}
				{...panelProps}
			>
				{shownComment && (
					<p key={`${run}-${shownComment}`} className={styles.comment}>
						{`# ${shownComment}`}
					</p>
				)}
				{timeline.map(({ block, at, linesAt }, blockIndex) => {
					const last = blockIndex === timeline.length - 1;

					return (
						<Fragment key={`${run}-${active}-${blockIndex}`}>
							{block.command && (
								<div className={styles.commandRow} style={{ '--at': at } as CSSProperties}>
									<ShellPrompt className={styles.prompt} {...block.prompt} />
									<p
										className={styles.command}
										data-last={last}
										style={{ '--chars': block.command.length } as CSSProperties}
									>
										<ShellCommand command={block.command} />
									</p>
									{commandCopy && last && (
										<CopyButton
											className={styles.commandCopy}
											feedback="icon"
											label="Copy the command"
											value={block.command}
										/>
									)}
								</div>
							)}
							{block.lines.map((line, index) => {
								return (
									<p
										key={`${run}-${active}-${blockIndex}-${index}-${line}`}
										className={styles.line}
										style={{ '--at': linesAt[index] } as CSSProperties}
									>
										{parseAnsi(line).map((segment, segmentIndex) => {
											return (
												<span
													key={segmentIndex}
													className={styles.segment}
													data-color={segment.color ?? undefined}
													data-dim={segment.dim || undefined}
													data-bold={segment.bold || undefined}
													data-inverse={segment.inverse || undefined}
												>
													{segment.text}
												</span>
											);
										})}
									</p>
								);
							})}
							{!last && (
								<p
									className={styles.line}
									style={{ '--at': linesAt[linesAt.length - 1] ?? at + TYPE_MS } as CSSProperties}
								>
									{' '}
								</p>
							)}
						</Fragment>
					);
				})}
				{tab?.screen && (
					<div
						key={`${run}-${active}-screen`}
						className={cn(styles.line, styles.screen)}
						style={{ '--at': endAt } as CSSProperties}
					>
						{tab.screen}
					</div>
				)}
			</div>
		</div>
	);
};

export default Terminal;
