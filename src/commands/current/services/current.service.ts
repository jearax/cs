import { getActiveProfile } from '@/modules/profiles/services/active-profile.service';
import { listArtifactProfiles } from '@/modules/profiles/services/artifact-cleanup.service';
import { loadCsConfig } from '@/modules/profiles/services/storage.service';

import type { NamedProfile } from '@/modules/profiles/types/profile.type';

export type CurrentResult = {
	active: NamedProfile | null;
	rendered: string[];
	notices: string[];
};

export const runCurrent = async (): Promise<CurrentResult> => {
	const { config, notices } = await loadCsConfig();
	const active = await getActiveProfile(config);
	const rendered = await listArtifactProfiles();

	return {
		active,
		rendered,
		notices
	};
};
