import { appendFile, mkdir, readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';

import { isInteractive } from '@/core/ui/terminal.ui';
import { binHomePath, CS_DIR_SEGMENTS } from '@/modules/profiles/constants/paths.constant';
import {
	hasRcMarker,
	isBinDirInPath,
	POSIX_EXPORT_LINE,
	resolveRcTarget
} from '@/modules/profiles/services/rc-path.service';

import type { BinPathOutcome } from '@/core/ui/artifact.ui';

export type EnsureBinPathOptions = {
	home?: string;
	shell?: string;
	path?: string;
	interactive?: boolean;
};

const readRcContent = async (rcPath: string): Promise<string> => {
	try {
		return await readFile(rcPath, 'utf8');
	} catch {
		return '';
	}
};

/**
 * Appends the marked PATH export to the shell rc, once. A file cs does not own is never rewritten:
 * the block is appended, and the marker keeps a second run from writing it again.
 */
export const ensureBinPath = async (options: EnsureBinPathOptions = {}): Promise<BinPathOutcome> => {
	const home = options.home ?? homedir();
	const shell = options.shell ?? process.env['SHELL'];
	const pathValue = options.path ?? process.env['PATH'];
	const interactive = options.interactive ?? isInteractive();
	const binPaths = [join(home, ...CS_DIR_SEGMENTS, 'bin'), binHomePath()];

	if (isBinDirInPath(pathValue, binPaths)) {
		return {
			status: 'already-in-path',
			rcPath: null,
			exportLine: POSIX_EXPORT_LINE
		};
	}

	const target = resolveRcTarget(shell, home);

	if (target === null) {
		return {
			status: 'unsupported-shell',
			rcPath: null,
			exportLine: POSIX_EXPORT_LINE
		};
	}

	const content = await readRcContent(target.rcPath);

	if (hasRcMarker(content)) {
		return {
			status: 'marker-present',
			rcPath: target.rcDisplayPath,
			exportLine: target.exportLine
		};
	}

	if (!interactive) {
		return {
			status: 'not-interactive',
			rcPath: target.rcDisplayPath,
			exportLine: target.exportLine
		};
	}

	await mkdir(dirname(target.rcPath), { recursive: true });

	const separator = content.length > 0 && !content.endsWith('\n') ? '\n' : '';

	await appendFile(target.rcPath, `${separator}${target.block}`);

	return {
		status: 'added',
		rcPath: target.rcDisplayPath,
		exportLine: target.exportLine
	};
};
