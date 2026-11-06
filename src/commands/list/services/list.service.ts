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

// Display order only: cs.json and other commands keep insertion order. The code-point
// tie-break sorts "Alpha" before "alpha" deterministically.
const compareNames = (a: string, b: string): number => {
	return a.localeCompare(b, undefined, { sensitivity: 'base' }) || (a < b ? -1 : a > b ? 1 : 0);
};

export const runList = async (): Promise<ListResult> => {
	const { config, notices } = await loadCsConfig();
	const active = await getActiveProfile(config);
	const rendered = new Set(await listArtifactProfiles());

	const entries = listProfiles(config)
		.map((profile) => {
			return {
				name: profile.name,
				profile,
				active: active?.name === profile.name,
				rendered: rendered.has(profile.name)
			};
		})
		.toSorted((a, b) => {
			if (a.name === 'default') {
				return -1;
			}

			if (b.name === 'default') {
				return 1;
			}

			return compareNames(a.name, b.name);
		});

	return {
		entries,
		aliases: listAliases(config).toSorted((a, b) => {
			return compareNames(a.name, b.name);
		}),
		notices
	};
};
