import { describe, expect, it } from 'vitest';

import {
	FISH_EXPORT_LINE,
	hasRcMarker,
	isBinDirInPath,
	POSIX_EXPORT_LINE,
	resolveRcTarget,
	RC_PATH_MARKER
} from '@/modules/profiles/services/rc-path.service';

const HOME = '/home/tester';

describe('the rc target resolver', () => {
	it.each([
		['/bin/zsh', 'zsh', '/home/tester/.zshrc', '~/.zshrc', POSIX_EXPORT_LINE],
		['/usr/local/bin/zsh', 'zsh', '/home/tester/.zshrc', '~/.zshrc', POSIX_EXPORT_LINE],
		['/bin/bash', 'bash', '/home/tester/.bashrc', '~/.bashrc', POSIX_EXPORT_LINE],
		['/usr/bin/fish', 'fish', '/home/tester/.config/fish/config.fish', '~/.config/fish/config.fish', FISH_EXPORT_LINE]
	])('maps %s to the %s rc file', (shell, expectedShell, rcPath, displayPath, exportLine) => {
		const target = resolveRcTarget(shell, HOME);

		expect(target?.shell).toBe(expectedShell);
		expect(target?.rcPath).toBe(rcPath);
		expect(target?.rcDisplayPath).toBe(displayPath);
		expect(target?.exportLine).toBe(exportLine);
	});

	it.each([['/bin/tcsh'], ['/usr/bin/nu'], [''], [undefined]])('has no rc target for %s', (shell) => {
		expect(resolveRcTarget(shell, HOME)).toBeNull();
	});

	it('builds a block with a leading blank line, the marker first', () => {
		const target = resolveRcTarget('/bin/zsh', HOME);

		expect(RC_PATH_MARKER).toBe('# Added by @jjuidev/cs');
		expect(target?.block).toBe(`\n${RC_PATH_MARKER}\n${POSIX_EXPORT_LINE}\n`);
		expect(
			target?.block.split('\n').filter((line) => {
				return line !== '';
			})
		).toHaveLength(2);
	});

	it('builds the fish block with the fish syntax', () => {
		const target = resolveRcTarget('/usr/bin/fish', HOME);

		expect(target?.block).toBe(`\n${RC_PATH_MARKER}\n${FISH_EXPORT_LINE}\n`);
	});
});

describe('the marker detector', () => {
	it('finds the marker wherever it sits in the file', () => {
		expect(hasRcMarker(`export FOO=1\n${RC_PATH_MARKER}\nexport PATH="$HOME/.config/cs/bin:$PATH"\n`)).toBe(true);
	});

	it('reports no marker in a file without it', () => {
		expect(hasRcMarker('export PATH="$HOME/.config/cs/bin:$PATH"\n')).toBe(false);
	});
});

describe('the PATH lookup', () => {
	const binPaths = ['/home/tester/.config/cs/bin', '~/.config/cs/bin'];

	it('finds the bin dir among the entries', () => {
		expect(isBinDirInPath('/usr/bin:/home/tester/.config/cs/bin:/bin', binPaths)).toBe(true);
	});

	it('finds the bin dir written as a tilde', () => {
		expect(isBinDirInPath('/usr/bin:~/.config/cs/bin', binPaths)).toBe(true);
	});

	it('reports no bin dir when the PATH holds other entries', () => {
		expect(isBinDirInPath('/usr/bin:/bin', binPaths)).toBe(false);
	});

	it('reports no bin dir for an empty or missing PATH', () => {
		expect(isBinDirInPath('', binPaths)).toBe(false);
		expect(isBinDirInPath(undefined, binPaths)).toBe(false);
	});
});
