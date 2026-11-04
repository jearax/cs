import { readFile } from 'node:fs/promises';

import { CliError } from '@/core/errors/cli.error';
import { atomicWriteFile } from '@/core/utils/atomic-write.util';
import { claudeSettingsPath } from '@/modules/profiles/constants/paths.constant';

import type { ClaudeSettings } from '@/modules/profiles/types/settings.type';

const SETTINGS_FILE_MODE = 0o600;

/**
 * The global settings file is read for detection and before every global write. A file that does
 * not parse is refused with an error, so cs never drops user keys on the next write; a missing
 * file reads as empty and is created on the first write.
 */
export const readClaudeSettings = async (): Promise<ClaudeSettings> => {
	let content: string;

	try {
		content = await readFile(claudeSettingsPath(), 'utf8');
	} catch {
		return {};
	}

	try {
		return JSON.parse(content) as ClaudeSettings;
	} catch {
		throw new CliError('~/.claude/settings.json is not valid JSON. Fix or remove it — cs changed nothing.');
	}
};

export const writeClaudeSettings = async (settings: ClaudeSettings): Promise<void> => {
	await atomicWriteFile(claudeSettingsPath(), JSON.stringify(settings, null, 2), SETTINGS_FILE_MODE);
};
