import { describe, expect, it } from 'vitest';

import { runCli } from './support/cli';
import { useTempHome } from './support/temp-home';

useTempHome();

describe('cs models', () => {
	it('lists the catalog with the dot-form and 1M notes', async () => {
		const { stdout, exitCode } = await runCli(['models']);

		expect(stdout).toContain('claude-opus-5-5');
		expect(stdout).toContain('claude-sonnet-5-5');
		expect(stdout).toContain('claude-haiku-5-5');
		expect(stdout).toContain('claude-fable-5-1');
		expect(stdout).toContain('claude-opus-4.7');
		expect(stdout).toContain('claude-opus-4-7');
		expect(stdout).toContain('[1m]');
		expect(exitCode).toBe(0);
	});

	it('hints the known models in the config show output', async () => {
		const { stdout } = await runCli(['config']);

		expect(stdout).toContain('Known models:');
		expect(stdout).toContain('claude-sonnet-5-5');
		expect(stdout).toContain('[1m]');
	});

	it('appears in the top-level help', async () => {
		const { stdout } = await runCli(['--help']);

		expect(stdout).toContain('models');
	});
});
