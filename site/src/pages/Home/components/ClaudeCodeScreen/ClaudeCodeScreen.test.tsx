import { ThemeProvider } from '@jjuidev/react';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';

import ClaudeCodeScreen, { Session } from './ClaudeCodeScreen';

const SESSIONS: Record<Session, { model: string; head: string }> = {
	claude: {
		model: 'claude-sonnet-5-5[1m]',
		head: 'claude-sonnet-5-5[1m] with high effort · Claude Pro'
	},
	planner: {
		model: 'claude-sonnet-5-5[1m]',
		head: 'claude-sonnet-5-5[1m] with high effort · Claude Pro'
	},
	cooker: {
		model: 'glm-5.3-flash[1m]',
		head: 'glm-5.3-flash[1m] with medium effort · API Usage Billing'
	}
};

const PROMPT_TEXT = 'Hi, are you OK? What is your model?';

describe('ClaudeCodeScreen', () => {
	for (const session of Object.keys(SESSIONS) as Session[]) {
		it(`plays the ${session} session in my-app with its model, and no settings or login noise`, async () => {
			const screen = await render(<ClaudeCodeScreen session={session} />, { wrapper: ThemeProvider });

			await expect.element(screen.getByText(SESSIONS[session].head)).toBeInTheDocument();
			await expect.element(screen.getByText('/exit')).toBeInTheDocument();

			const text = screen.container.textContent ?? '';

			for (const expected of [
				'~/my-app',
				'⎇ main',
				PROMPT_TEXT,
				`Model: ${SESSIONS[session].model}`,
				'⏵⏵ bypass permissions on'
			]) {
				expect(text).toContain(expected);
			}

			for (const banned of ['--settings', 'global', '/login', 'pending', 'launcher', 'ghost-proc-guard']) {
				expect(text).not.toContain(banned);
			}
		});
	}
});
