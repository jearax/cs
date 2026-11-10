import { cn } from '@jjuidev/styles/variants';
import { ComponentProps, CSSProperties, useEffect, useState } from 'react';

import styles from './styles.module.css';

export interface ClaudeCodeScreenProps extends ComponentProps<'div'> {
	/** Which surface the screen demos: the global `claude`, or a launcher pinned to one profile. */
	session?: Session;
}

export type Session = 'global' | 'planner' | 'cooker';

const HEAD: readonly { product: string; model: string; cwd: string }[] = [
	{
		product: 'Claude Code v2.1.321',
		model: 'claude-sonnet-5-5[1m] · profile: claude (global)',
		cwd: '~'
	},
	{
		product: 'claude-planner',
		model: 'claude-sonnet-5-5[1m] · claude --settings ~/.config/cs/profiles/claude.json',
		cwd: '~'
	},
	{
		product: 'claude-cooker',
		model: 'glm-5.3-flash[1m] · claude --settings ~/.config/cs/profiles/glm.json',
		cwd: '~/jearax/npm/cs'
	}
];

const PROFILE_LINE: readonly { line: string }[] = [
	{
		line: 'Reading ~/.claude/settings.json — official https://api.anthropic.com, no token in the store: this session signs in with /login.'
	},
	{
		line: 'Loaded ~/.config/cs/profiles/claude.json — official https://api.anthropic.com, this launcher pins the claude profile for one session.'
	},
	{
		line: 'Loaded ~/.config/cs/profiles/glm.json — base URL https://api.z.ai/api/anthropic, every model pinned to glm-5.3-flash[1m].'
	}
];

const ASK_LINE: readonly { ask: string; option: string; hint: string; alt: string }[] = [
	{
		ask: 'Sign in with /login to use the official API?',
		option: '❯ 1. /login',
		hint: 'cs use claude wrote the official endpoint; the store keeps no token for it.',
		alt: '2. Set ANTHROPIC_AUTH_TOKEN'
	},
	{
		ask: 'Keep planner work on the claude profile?',
		option: '❯ 1. Yes, this session stays on claude',
		hint: 'The launcher passes the rendered file; cs use elsewhere cannot move this session.',
		alt: '2. Switch the global profile'
	},
	{
		ask: 'Cook on glm through the z.ai endpoint?',
		option: '❯ 1. Yes, this session stays on glm',
		hint: 'Same rendered file as the cooker launcher wrote; the global profile is untouched.',
		alt: '2. Switch the global profile'
	}
];

// Seconds after the screen appears; the CSS turns them into delays.
const at = (seconds: number) => {
	return { '--t': `${seconds}s` } as CSSProperties;
};

const SessionScreen = ({ session, ...props }: ClaudeCodeScreenProps) => {
	const index = session === 'global' ? 0 : session === 'planner' ? 1 : 2;
	const head = HEAD[index]!;
	const profileLine = PROFILE_LINE[index]!.line;
	const ask = ASK_LINE[index]!;
	const prompt = session === 'global' ? 'Hi! What should I do first here?' : 'Start on this profile.';

	return (
		<div className={cn(styles.root, props.className)} style={{ '--chars': prompt.length } as CSSProperties} {...props}>
			<div className={styles.log}>
				<div className={styles.head}>
					<p>
						<span className={styles.product}>{head.product}</span> <span className={styles.muted}>{head.model}</span>
					</p>
					<p className={styles.muted}>{head.cwd}</p>
				</div>

				<div className={styles.turn} style={at(2.4)}>
					<p className={styles.prompt}>❯ {prompt}</p>
				</div>

				<div className={styles.turn} style={at(3.2)}>
					<div>
						<p>
							<span className={styles.bullet}>●</span> {profileLine}
						</p>
					</div>
				</div>

				<div className={styles.turn} style={at(4.6)}>
					<div>
						<p>
							<span className={styles.done}>●</span> <span className={styles.product}>Bash</span>(cs current)
						</p>
						<p className={cn(styles.indent, styles.muted)}>
							⎿{' '}
							{session === 'global'
								? 'Active: claude'
								: session === 'planner'
									? 'Active: default · launcher: claude-planner'
									: 'Active: default · launcher: claude-cooker'}
						</p>
					</div>
				</div>

				<div className={styles.turn} style={at(5.8)}>
					<div className={styles.question}>
						<p>
							<span className={styles.chip}>☐ Profile</span>
						</p>
						<p className={styles.product}>{ask.ask}</p>
						<p>
							<span className={styles.option}>{ask.option}</span>
						</p>
						<p className={styles.indent}>
							<span className={styles.muted}>{ask.hint}</span>
						</p>
						<p className={styles.indent}>{ask.alt}</p>
					</div>
				</div>
			</div>

			<div className={styles.foot}>
				<p className={styles.input}>
					<span className={styles.chevron}>❯</span> <span className={styles.typed}>{prompt}</span>
					<span className={styles.choice} data-reveal-end>
						1
					</span>
					<span className={styles.caret} aria-hidden="true" />
					<span className={styles.placeholder}>
						<span className={styles.caretOn}>T</span>ry &quot;fix lint errors&quot;
					</span>
				</p>

				<div className={styles.status}>
					<p>
						<span className={styles.cwd}>cwd: {head.cwd}</span> <span className={styles.branch}>⎇ main</span>
					</p>
					<p>
						<span className={styles.model}>Model: {index === 2 ? 'glm-5.3-flash[1m]' : 'claude-sonnet-5-5[1m]'}</span>{' '}
						<span className={styles.thinking}>Thinking: on</span>{' '}
						<span className={styles.context}>Context: 0/1.0M (0%)</span>
					</p>
					<p className={styles.usage}>
						Session: <span className={styles.usageValue}>1.0% (04:59)</span> · Weekly:{' '}
						<span className={styles.usageValue}>0.0% (6d 23h)</span>
					</p>
					<p>
						<span className={styles.mode}>
							{index === 0 ? '⏵⏵ /login pending' : index === 1 ? '⏵⏵ planner launcher' : '⏵⏵ cooker launcher'}
						</span>{' '}
						<span className={styles.muted}>(shift+tab to cycle)</span>
					</p>
				</div>
			</div>
		</div>
	);
};

// How long one surface stays up before the next takes over, and the cycle's total.
const SESSION_MS = 8000;
const CYCLE: readonly Session[] = ['global', 'planner', 'cooker'];

/**
 * The three real usage surfaces, in the order the hero tells the story: the global `claude`
 * after `cs use claude`, then the two launchers the aliases created. One surface at a time.
 */
const ClaudeCodeScreen = ({ session, ...props }: ClaudeCodeScreenProps) => {
	const [active, setActive] = useState<Session>(session ?? 'global');

	useEffect(() => {
		if (session !== undefined) {
			return;
		}

		const timer = window.setInterval(() => {
			setActive((current) => {
				return CYCLE[(CYCLE.indexOf(current) + 1) % CYCLE.length] ?? 'global';
			});
		}, SESSION_MS);

		return () => {
			window.clearInterval(timer);
		};
	}, [session]);

	// The key restarts the screen's own timeline, so each surface plays from its first turn.
	return <SessionScreen key={active} session={active} {...props} />;
};

export default ClaudeCodeScreen;
