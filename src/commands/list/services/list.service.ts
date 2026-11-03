import { getActiveProfile } from '@/modules/profiles/services/active-profile.service';
import { listArtifactProfiles } from '@/modules/profiles/services/artifact-cleanup.service';
import { listAliases, listProfiles, loadCsConfig } from '@/modules/profiles/services/storage.service';

import type { AliasEntry } from '@/modules/profiles/services/storage.service';
import type { Profile } from '@/modules/profiles/types/profile.type';

export type ListEntry = {
	name: string;
	profile: Profile;
	active: boolean;
	rendered: boolean;
};

export type ListResult = {
	entries: ListEntry[];
	aliases: AliasEntry[];
	notices: string[];
};

export const runList = async (): Promise<ListResult> => {
	const { config, notices } = await loadCsConfig();
	const active = await getActiveProfile(config);
	const rendered = new Set(await listArtifactProfiles());

	const entries = listProfiles(config).map((profile) => {
		return {
			name: profile.name,
			profile,
			active: active?.name === profile.name,
			rendered: rendered.has(profile.name)
		};
	});

	return {
		entries,
		aliases: listAliases(config),
		notices
	};
};
