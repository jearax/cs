import { join } from 'node:path';

export const RC_PATH_MARKER = '# Added by @jjuidev/cs';

export const POSIX_EXPORT_LINE = 'export PATH="$HOME/.config/cs/bin:$PATH"';

export const FISH_EXPORT_LINE = 'fish_add_path $HOME/.config/cs/bin';

export type RcShell = 'zsh' | 'bash' | 'fish';

export type RcTarget = {
	shell: RcShell;
	rcPath: string;
	rcDisplayPath: string;
	exportLine: string;
	block: string;
};

const RC_RELATIVE_PATHS: Record<RcShell, string> = {
	zsh: '.zshrc',
	bash: '.bashrc',
	fish: '.config/fish/config.fish'
};

const SHELL_BY_NAME: Record<string, RcShell> = {
	zsh: 'zsh',
	bash: 'bash',
	fish: 'fish'
};

const detectShell = (shell: string | undefined): RcShell | null => {
	return SHELL_BY_NAME[(shell ?? '').split('/').pop() ?? ''] ?? null;
};

/** The rc file the shell reads, and the block cs appends to it. */
export const resolveRcTarget = (shell: string | undefined, home: string): RcTarget | null => {
	const detected = detectShell(shell);

	if (detected === null) {
		return null;
	}

	const relativePath = RC_RELATIVE_PATHS[detected];
	const exportLine = detected === 'fish' ? FISH_EXPORT_LINE : POSIX_EXPORT_LINE;

	return {
		shell: detected,
		rcPath: join(home, ...relativePath.split('/')),
		rcDisplayPath: `~/${relativePath}`,
		exportLine,
		block: `\n${RC_PATH_MARKER}\n${exportLine}\n`
	};
};

export const hasRcMarker = (content: string): boolean => {
	return content.includes(RC_PATH_MARKER);
};

/** The bin dir is in PATH when one of its spellings is one of the entries. */
export const isBinDirInPath = (pathValue: string | undefined, binPaths: readonly string[]): boolean => {
	if (pathValue === undefined || pathValue === '') {
		return false;
	}

	const entries = pathValue.split(':');

	return entries.some((entry) => {
		return binPaths.includes(entry);
	});
};
