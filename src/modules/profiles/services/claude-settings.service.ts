import { chmod, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

import { claudeSettingsPath } from '@/modules/profiles/constants/paths.constant';

import type { ClaudeSettings } from '@/modules/profiles/types/settings.type';

const SETTINGS_FILE_MODE = 0o600;

/** An unreadable settings file reads as empty, so cs never fails on someone else's file. */
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
		return {};
	}
};

export const writeClaudeSettings = async (settings: ClaudeSettings): Promise<void> => {
	const path = claudeSettingsPath();

	await mkdir(dirname(path), { recursive: true });
	await writeFile(path, JSON.stringify(settings, null, 2), { mode: SETTINGS_FILE_MODE });
	await chmod(path, SETTINGS_FILE_MODE);
};
