import { describe, expect, it } from 'vitest';

import { ENV_KEY_PATTERN } from '@/commands/env/services/env.service';
import { ENV_CATALOG, ENV_DOCS_URL } from '@/modules/profiles/constants/env-catalog.constant';

describe('the env catalog', () => {
	it('names the official env-vars docs as its source', () => {
		expect(ENV_DOCS_URL).toBe('https://code.claude.com/docs/en/env-vars');
	});

	it('holds exactly the keys cs interacts with', () => {
		expect(
			ENV_CATALOG.map((entry) => {
				return entry.key;
			})
		).toEqual(['CLAUDE_CODE_AUTO_COMPACT_WINDOW', 'CLAUDE_CODE_DISABLE_1M_CONTEXT']);
	});

	it('holds valid, unique, sorted keys', () => {
		const keys = ENV_CATALOG.map((entry) => {
			return entry.key;
		});

		expect(keys).toEqual([...keys].sort());
		expect(new Set(keys).size).toBe(keys.length);

		for (const key of keys) {
			expect(ENV_KEY_PATTERN.test(key)).toBe(true);
		}
	});

	it('never suggests the credential keys cs manages through profiles', () => {
		const keys = ENV_CATALOG.map((entry) => {
			return entry.key;
		});

		expect(keys).not.toContain('ANTHROPIC_BASE_URL');
		expect(keys).not.toContain('ANTHROPIC_AUTH_TOKEN');
	});

	it('carries the overrides-cs note only on the keys cs derives', () => {
		for (const entry of ENV_CATALOG) {
			expect(entry.managedByCs === true).toBe(
				entry.key === 'CLAUDE_CODE_DISABLE_1M_CONTEXT' || entry.key === 'CLAUDE_CODE_AUTO_COMPACT_WINDOW'
			);
		}
	});
});
