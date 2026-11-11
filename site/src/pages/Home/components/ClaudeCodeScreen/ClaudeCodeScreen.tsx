import { cn } from '@jjuidev/styles/variants';
import { ComponentProps, CSSProperties, Fragment } from 'react';

import styles from './styles.module.css';

export type Session = 'claude' | 'planner' | 'cooker';

export interface ClaudeCodeScreenProps extends ComponentProps<'div'> {
	/** Which session the screen plays: the claude profile, the planner launcher, or the cooker one. */
	session: Session;
}

type SessionInfo = {
	model: string;
	effort: 'high' | 'medium';
	plan: string;
	context: string;
	usage: readonly { label: string; value: string }[];
	placeholder: string;
};

// The two claude sessions sign in to a subscription; glm bills an API key, and its usage line has no weekly cap.
const SESSIONS: Record<Session, SessionInfo> = {
	claude: {
		model: 'claude-sonnet-5-5[1m]',
		effort: 'high',
		plan: 'Claude Pro',
		context: '18k/1.0M (2%)',
		usage: [
			{
				label: 'Session',
				value: '12.4% (03:41)'
			},
			{
				label: 'Weekly',
				value: '8.2% (5d 06:12)'
			}
		],
		placeholder: 'Try "how does <filepath> work?"'
	},
	planner: {
		model: 'claude-sonnet-5-5[1m]',
		effort: 'high',
		plan: 'Claude Pro',
		context: '19k/1.0M (2%)',
		usage: [
			{
				label: 'Session',
				value: '12.9% (03:39)'
			},
			{
				label: 'Weekly',
				value: '8.3% (5d 06:10)'
			}
		],
		placeholder: 'Try "fix lint errors"'
	},
	cooker: {
		model: 'glm-5.3-flash[1m]',
		effort: 'medium',
		plan: 'API Usage Billing',
		context: '17k/1.0M (2%)',
		usage: [
			{
				label: 'Session',
				value: '3% (04:52)'
			}
		],
		placeholder: 'Try "edit <filepath> to..."'
	}
};

const PROMPT = 'Hi, are you OK? What is your model?';
const EXIT_COMMAND = '/exit';

// Seconds after the screen appears; the CSS turns them into delays.
const at = (seconds: number) => {
	return { '--t': `${seconds}s` } as CSSProperties;
};

const SessionScreen = ({ info }: { info: SessionInfo }) => {
	return (
		<>
			<div className={styles.log}>
				<div className={styles.head}>
					<p>
						<span className={styles.product}>Claude Code</span> <span className={styles.muted}>v2.1.322</span>
					</p>
					<p className={styles.muted}>
						{info.model} with {info.effort} effort · {info.plan}
					</p>
					<p className={styles.muted}>~/my-app</p>
				</div>

				<div className={styles.turn} style={at(3)}>
					<p className={styles.prompt}>❯ {PROMPT}</p>
				</div>

				<div className={styles.turn} style={at(4.4)}>
					<p>
						<span className={styles.done}>●</span> {"I'm doing well, thanks! I'm running on "}
						{info.model}.
					</p>
				</div>
			</div>

			<div className={styles.foot}>
				<p className={styles.input}>
					<span className={styles.chevron}>❯</span> <span className={styles.placeholder}>{info.placeholder}</span>
					<span className={styles.typed}>{PROMPT}</span>
					<span className={styles.exit} style={{ '--chars': EXIT_COMMAND.length } as CSSProperties}>
						{EXIT_COMMAND}
					</span>
					<span className={styles.caret} aria-hidden="true" />
				</p>

				<div className={styles.status}>
					<p>
						<span className={styles.cwd}>cwd: ~/my-app</span> <span className={styles.branch}>⎇ main</span>{' '}
						<span className={styles.diff}>(+0,-0)</span>
					</p>
					<p>
						<span className={styles.model}>Model: {info.model}</span>{' '}
						<span className={styles.thinking}>Thinking: {info.effort}</span>{' '}
						<span className={styles.context}>Context: {info.context}</span>
					</p>
					<p className={styles.usage}>
						{info.usage.map(({ label, value }, index) => {
							return (
								<Fragment key={label}>
									{index > 0 && ' · '}
									{label}: <span className={styles.usageValue}>{value}</span>
								</Fragment>
							);
						})}
					</p>
					<p>
						<span className={styles.mode}>⏵⏵ bypass permissions on</span>{' '}
						<span className={styles.muted}>(shift+tab to cycle)</span>
					</p>
				</div>
			</div>
		</>
	);
};

// How long one session screen stays up before the shell takes over again.
export const CLAUDE_SESSION_MS = 7000;

/**
 * One Claude Code session in ~/my-app: the prompt is typed and sent, the model answers, and
 * `/exit` closes the session. Which session plays is the caller's choice; the use tab pages
 * through them one per screen.
 */
const ClaudeCodeScreen = ({ session, className, ...props }: ClaudeCodeScreenProps) => {
	return (
		<div {...props} className={cn(styles.root, className)} style={{ '--chars': PROMPT.length } as CSSProperties}>
			<SessionScreen info={SESSIONS[session]} />
		</div>
	);
};

export default ClaudeCodeScreen;
