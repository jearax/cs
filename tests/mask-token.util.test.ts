import { describe, expect, it } from 'vitest';

import { maskToken } from '@/core/utils/mask-token.util';

describe('the token masker', () => {
	it('reports an empty token as not set', () => {
		expect(maskToken('')).toBe('<not set>');
	});

	it.each([
		['a', 1],
		['ab', 2],
		['abcdefgh', 8]
	])('collapses a token of %i characters to its first two', (token) => {
		expect(maskToken(token)).toBe(`${token.slice(0, 2)}****`);
	});

	it.each([
		['abcdefghi', 9],
		['abcdefghjk', 10],
		['abcdefghjkl', 11],
		['abcdefghijkl', 12]
	])('shows only the head of a token of %i characters', (token) => {
		expect(maskToken(token)).toBe(`${token.slice(0, 4)}****`);
	});

	it('shows the head and tail of a longer token', () => {
		expect(maskToken('abcdefghijklm')).toBe('abcdefgh...jklm');
		expect(maskToken('sk-ant-api03-very-long-secret-value')).toBe('sk-ant-a...alue');
	});

	it('never returns the full token, whatever its length', () => {
		for (let length = 1; length <= 40; length += 1) {
			const token = 'x'.repeat(length);

			expect(maskToken(token)).not.toBe(token);
		}
	});

	it('hides everything past the head of a nine-to-twelve-character token', () => {
		for (let length = 9; length <= 12; length += 1) {
			const token = 'abcdefghij'.slice(0, length).padEnd(length, 'k');

			expect(maskToken(token)).not.toContain(token.slice(4));
		}
	});
});
