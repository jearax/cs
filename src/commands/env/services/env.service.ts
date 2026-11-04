import { CliError } from '@/core/errors/cli.error';
import { ENV_CATALOG } from '@/modules/profiles/constants/env-catalog.constant';
import { listArtifactProfiles } from '@/modules/profiles/services/artifact-cleanup.service';
import { ensureBinPath } from '@/modules/profiles/services/ensure-bin-path.service';
import { renderProfileArtifacts } from '@/modules/profiles/services/render-artifacts.service';
import {
	findProfile,
	listProfiles,
	loadCsConfig,
	saveCsConfig,
	upsertProfile
} from '@/modules/profiles/services/storage.service';

import type { BinPathOutcome } from '@/core/ui/artifact.ui';

export const ENV_KEY_PATTERN = /^[A-Z][A-Z0-9_]*$/;

export type EnvScope = 'global' | 'profile';

export type EnvAction = 'set' | 'unset';

export type EnvResult = {
	target: string;
	action: EnvAction;
	key: string;
	rerendered: string[];
	notices: string[];
	binPath: BinPathOutcome | null;
};

export type EnvKeyOption = {
	label: string;
	value: string;
	hint?: string;
};

/** The SET suggestions: the curated catalog; the hint carries the description. */
export const buildSetKeyOptions = (): EnvKeyOption[] => {
	return ENV_CATALOG.map((entry) => {
		return {
			label: entry.key,
			value: entry.key,
			hint: entry.managedByCs === true ? `${entry.description} (overrides cs)` : entry.description
		};
	});
};

/** The UNSET suggestions: the keys actually set in the chosen scope, nothing else. */
export const buildUnsetKeyOptions = async (scope: EnvScope, profileName?: string): Promise<EnvKeyOption[]> => {
	const { config } = await loadCsConfig();

	const source = scope === 'profile' && profileName !== undefined ? findProfile(config, profileName)?.env : config.env;

	return Object.keys(source ?? {}).map((key) => {
		return {
			label: key,
			value: key
		};
	});
};

export const listEnvProfiles = async (): Promise<string[]> => {
	const { config } = await loadCsConfig();

	return listProfiles(config).map((profile) => {
		return profile.name;
	});
};

export const applyEnvChange = async (
	scope: EnvScope,
	profileName: string | undefined,
	action: EnvAction,
	key: string,
	value: string | undefined
): Promise<EnvResult> => {
	const { config, notices } = await loadCsConfig();
	const rerendered: string[] = [];

	if (scope === 'profile') {
		if (profileName === undefined) {
			throw new CliError('No profile selected.');
		}

		const profile = findProfile(config, profileName);

		if (profile === undefined) {
			throw new CliError(`Profile "${profileName}" not found.`);
		}

		const nextEnv = { ...(profile.env ?? {}) };

		if (action === 'set' && value !== undefined) {
			nextEnv[key] = value;
		} else {
			delete nextEnv[key];
		}

		const updated = upsertProfile(config, profileName, { env: nextEnv });

		await saveCsConfig(config);
		await renderProfileArtifacts(profileName, updated, config.env ?? {}, config.aliases ?? {});
		rerendered.push(profileName);

		const binPath = await ensureBinPath();

		return {
			target: `profile:"${profileName}"`,
			action,
			key,
			rerendered,
			notices,
			binPath
		};
	}

	const nextEnv = { ...(config.env ?? {}) };

	if (action === 'set' && value !== undefined) {
		nextEnv[key] = value;
	} else {
		delete nextEnv[key];
	}

	config.env = nextEnv;

	await saveCsConfig(config);

	// The global env is part of every render, so every rendered profile is rebuilt.
	for (const name of await listArtifactProfiles()) {
		const profile = findProfile(config, name);

		if (profile === undefined) {
			continue;
		}

		await renderProfileArtifacts(name, profile, config.env ?? {}, config.aliases ?? {});
		rerendered.push(name);
	}

	const binPath = rerendered.length > 0 ? await ensureBinPath() : null;

	return {
		target: 'global',
		action,
		key,
		rerendered,
		notices,
		binPath
	};
};
