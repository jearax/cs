import { readFile } from 'node:fs/promises';

import { describe, expect, it } from 'vitest';

import { runAlias } from '@/commands/alias/services/alias.service';
import { csConfigPath, launcherPath, profileArtifactPath } from '@/modules/profiles/constants/paths.constant';

import { runCli } from './support/cli';
import { useTempHome } from './support/temp-home';

useTempHome();

const exists = async (path: string): Promise<boolean> => {
	try {
		await readFile(path);

		return true;
	} catch {
		return false;
	}
};

const readAliases = async (): Promise<Record<string, string>> => {
	const config = JSON.parse(await readFile(csConfigPath(), 'utf8')) as {
		aliases?: Record<string, string>;
	};

	return config.aliases ?? {};
};

describe('cs alias', () => {
	it('writes the launcher and records the alias', async () => {
		await runCli(['config', '-n', 'work', '-u', 'https://example.com', '-t', 'sk-fake-token']);

		const { stdout, exitCode } = await runCli(['alias', 'planner', 'work']);

		expect(stdout).toContain('Alias "planner" created at profile "work"');
		expect(stdout).toContain('claude-planner');
		expect(exitCode).toBe(0);

		expect(await readAliases()).toEqual({ planner: 'work' });
		expect(await exists(launcherPath('planner'))).toBe(true);
	});

	it('points the launcher at the artifact of the target profile', async () => {
		await runCli(['config', '-n', 'work', '-u', 'https://example.com', '-t', 'sk-fake-token']);
		await runCli(['alias', 'planner', 'work']);

		const launcher = await readFile(launcherPath('planner'), 'utf8');

		expect(launcher).toContain('exec claude --settings ~/.config/cs/profiles/work.json');
	});

	it('re-points an alias at another profile', async () => {
		await runCli(['config', '-n', 'work', '-u', 'https://example.com', '-t', 'sk-fake-token']);
		await runCli(['config', '-n', 'other', '-u', 'https://other.example.com', '-t', 'sk-fake-token']);
		await runCli(['alias', 'planner', 'work']);

		const { stdout, exitCode } = await runCli(['alias', 'planner', 'other']);

		expect(stdout).toContain('Alias "planner" re-pointed at profile "other"');
		expect(exitCode).toBe(0);

		expect(await readAliases()).toEqual({ planner: 'other' });

		const launcher = await readFile(launcherPath('planner'), 'utf8');

		expect(launcher).toContain('exec claude --settings ~/.config/cs/profiles/other.json');
	});

	it('aliases the default profile without a special case', async () => {
		const { stdout, exitCode } = await runCli(['alias', 'planner', 'default']);

		expect(stdout).toContain('Alias "planner" created at profile "default"');
		expect(exitCode).toBe(0);

		expect(await readAliases()).toEqual({ planner: 'default' });
	});

	it('rejects an alias name that collides with a profile name', async () => {
		await runCli(['config', '-n', 'work', '-u', 'https://example.com', '-t', 'sk-fake-token']);

		const { stderr, exitCode } = await runCli(['alias', 'work', 'default']);

		expect(stderr).toContain('Alias "work" collides with the profile of the same name');
		expect(exitCode).toBe(1);

		expect(await readAliases()).toEqual({});
	});

	it('rejects a target profile that does not exist', async () => {
		const { stderr, exitCode } = await runCli(['alias', 'planner', 'ghost']);

		expect(stderr).toContain('Profile "ghost" not found');
		expect(exitCode).toBe(1);

		expect(await readAliases()).toEqual({});
		expect(await exists(launcherPath('planner'))).toBe(false);
	});

	it('rejects an alias name that is not a valid name', async () => {
		const { stderr, exitCode } = await runCli(['alias', '../escape', 'default']);

		expect(stderr).toContain('Alias name cannot contain path separators');
		expect(exitCode).toBe(1);
	});

	it('names the missing argument in the commander error', async () => {
		const { stderr, exitCode } = await runCli(['alias', 'planner']);

		expect(stderr).toContain("missing required argument 'profile'");
		expect(exitCode).toBe(1);
	});

	it('shows both placeholders and the examples in its help', async () => {
		const { stdout } = await runCli(['alias', '--help']);

		const unwrapped = stdout.replace(/\n\s+/g, ' ');

		expect(stdout).toContain('<name>');
		expect(stdout).toContain('<profile>');
		expect(unwrapped).toContain('Examples:');
		expect(unwrapped).toContain('$ cs alias planner work');
		expect(unwrapped).toContain('$ cs alias remove planner');
		expect(unwrapped).toContain('Re-point claude-planner to the other profile');
	});
});

describe('cs alias remove', () => {
	const seedTwoAliases = async (): Promise<void> => {
		await runCli(['config', '-n', 'work', '-u', 'https://example.com', '-t', 'sk-fake-token']);
		await runCli(['alias', 'planner', 'work']);
		await runCli(['alias', 'helper', 'work']);
	};

	it('removes one of two aliases, leaving the profile, artifact and sibling launcher', async () => {
		await seedTwoAliases();

		const { stdout, exitCode } = await runCli(['alias', 'remove', 'planner']);

		expect(stdout).toContain('Alias "planner" removed (was → work).');
		expect(stdout).toContain(`\nLauncher: ${launcherPath('planner')}`);
		expect(exitCode).toBe(0);

		expect(await exists(launcherPath('planner'))).toBe(false);
		expect(await exists(launcherPath('helper'))).toBe(true);
		expect(await exists(profileArtifactPath('work'))).toBe(true);
		expect(await readAliases()).toEqual({ helper: 'work' });

		const { stdout: listOutput } = await runCli(['list']);

		expect(listOutput).not.toContain('planner');
	});

	it('removes via the rm shorthand', async () => {
		await seedTwoAliases();

		const { stdout, exitCode } = await runCli(['alias', 'rm', 'helper']);

		expect(stdout).toContain('Alias "helper" removed (was → work).');
		expect(exitCode).toBe(0);

		expect(await readAliases()).toEqual({ planner: 'work' });
		expect(await exists(launcherPath('helper'))).toBe(false);
	});

	it('removes several aliases in one call', async () => {
		await seedTwoAliases();
		await runCli(['alias', 'reviewer', 'work']);

		const { stdout, exitCode } = await runCli(['alias', 'rm', 'planner', 'reviewer']);

		expect(stdout).toContain('Alias "planner" removed (was → work).');
		expect(stdout).toContain('Alias "reviewer" removed (was → work).');
		expect(exitCode).toBe(0);

		expect(await readAliases()).toEqual({ helper: 'work' });
		expect(await exists(launcherPath('planner'))).toBe(false);
		expect(await exists(launcherPath('reviewer'))).toBe(false);
	});

	it('removes a duplicated name once', async () => {
		await seedTwoAliases();

		const { stdout, exitCode } = await runCli(['alias', 'rm', 'planner', 'planner']);

		expect(stdout.match(/removed \(was → /gu) ?? []).toHaveLength(1);
		expect(exitCode).toBe(0);

		expect(await readAliases()).toEqual({ helper: 'work' });
	});

	it('removes nothing when one name is unknown', async () => {
		await seedTwoAliases();

		const { stderr, exitCode } = await runCli(['alias', 'rm', 'planner', 'ghost']);

		expect(stderr).toContain('Alias "ghost" not found.');
		expect(stderr).toContain('List the aliases: cs list');
		expect(exitCode).toBe(1);

		expect(await readAliases()).toEqual({
			planner: 'work',
			helper: 'work'
		});
		expect(await exists(launcherPath('planner'))).toBe(true);
	});

	it('rejects an unknown single alias with the list hint', async () => {
		await seedTwoAliases();

		const { stderr, exitCode } = await runCli(['alias', 'remove', 'ghost']);

		expect(stderr).toContain('Alias "ghost" not found.');
		expect(stderr).toContain('List the aliases: cs list');
		expect(exitCode).toBe(1);

		expect(await readAliases()).toEqual({
			planner: 'work',
			helper: 'work'
		});
	});

	it('names the missing argument in the commander error', async () => {
		const { stderr, exitCode } = await runCli(['alias', 'remove']);

		expect(stderr).toContain("missing required argument 'aliases'");
		expect(exitCode).toBe(1);
	});

	it('routes the reserved names to removal, never to alias creation', async () => {
		await runCli(['config', '-n', 'work', '-u', 'https://example.com', '-t', 'sk-fake-token']);

		await expect(runAlias('remove', 'work')).rejects.toThrow('is reserved for removing aliases');
		await expect(runAlias('rm', 'work')).rejects.toThrow('is reserved for removing aliases');

		const { stderr, exitCode } = await runCli(['alias', 'rm', 'work']);

		expect(stderr).toContain('Alias "work" not found.');
		expect(exitCode).toBe(1);

		const { stderr: removeStderr, exitCode: removeExitCode } = await runCli(['alias', 'remove', 'work']);

		expect(removeStderr).toContain('Alias "work" not found.');
		expect(removeExitCode).toBe(1);

		expect(await exists(launcherPath('rm'))).toBe(false);
		expect(await exists(launcherPath('remove'))).toBe(false);
		expect(await readAliases()).toEqual({});
	});

	it('shows the single-alias example in the remove help', async () => {
		const { stdout, exitCode } = await runCli(['alias', 'remove', '--help']);

		const unwrapped = stdout.replace(/\n\s+/g, ' ');

		expect(exitCode).toBe(0);
		expect(unwrapped).toContain('$ cs alias remove planner');
	});
});
