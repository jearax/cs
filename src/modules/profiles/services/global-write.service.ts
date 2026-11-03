import { CONNECTORS_SETTING_KEY } from '@/modules/profiles/constants/profile.constant';
import { readClaudeSettings, writeClaudeSettings } from '@/modules/profiles/services/claude-settings.service';
import { renderProfileSettings } from '@/modules/profiles/services/render.service';
import { saveCsConfig } from '@/modules/profiles/services/storage.service';

import type { CsConfig, Profile } from '@/modules/profiles/types/profile.type';

/**
 * The global target. The keys the user keeps stay; the env block is replaced, so a profile
 * never inherits the env of the profile before it. settings.json is written first, so the
 * owned-key list never claims a key that was not written.
 */
export const writeProfileGlobally = async (config: CsConfig, name: string, profile: Profile): Promise<void> => {
	const rendered = renderProfileSettings({
		profile,
		globalEnv: config.env ?? {}
	});

	const settings = await readClaudeSettings();

	await writeClaudeSettings({
		...settings,
		env: rendered.env,
		disableClaudeAiConnectors: true
	});

	config.currentProfile = name;

	const ownedKeys = config.ownedClaudeSettingsKeys ?? [];

	if (!ownedKeys.includes(CONNECTORS_SETTING_KEY)) {
		config.ownedClaudeSettingsKeys = [...ownedKeys, CONNECTORS_SETTING_KEY];
	}

	await saveCsConfig(config);
};
