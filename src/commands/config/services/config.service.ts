import { CliError } from '@/core/errors/cli.error';
import { denormalizeModelId } from '@/core/utils/denormalize-model-id.util';
import { hasTokenWithoutUrl, TOKEN_WITHOUT_URL_HINT } from '@/modules/profiles/checks/login-mode.check';
import { validateProfileName } from '@/modules/profiles/checks/profile-name.check';
import { BOTH_TOKENS_HINT, hasBothTokens } from '@/modules/profiles/checks/token-exclusivity.check';
import { EMPTY_PROFILE, OFFICIAL_PROFILE } from '@/modules/profiles/constants/profile.constant';
import { ensureBinPath } from '@/modules/profiles/services/ensure-bin-path.service';
import { renderProfileArtifacts } from '@/modules/profiles/services/render-artifacts.service';
import {
	findAliasTarget,
	findProfile,
	loadCsConfig,
	saveCsConfig,
	upsertProfile
} from '@/modules/profiles/services/storage.service';

import type { BinPathOutcome } from '@/core/ui/artifact.ui';
import type { ProfileArtifacts } from '@/modules/profiles/services/render-artifacts.service';
import type { CsConfig, Profile, ProfileUpdate } from '@/modules/profiles/types/profile.type';

export type ConfigOptions = {
	name?: string;
	url?: string;
	token?: string;
	oauthToken?: string;

	haiku?: string;
	sonnet?: string;
	opus?: string;
	fable?: string;
};

export type ConfigResult = {
	kind: 'shown' | 'created' | 'updated';
	name: string;
	profile: Profile;
	artifacts: ProfileArtifacts | null;
	notices: string[];
	binPath: BinPathOutcome | null;
};

const hasUpdates = (options: ConfigOptions): boolean => {
	return (
		options.url !== undefined ||
		options.token !== undefined ||
		options.oauthToken !== undefined ||
		options.haiku !== undefined ||
		options.sonnet !== undefined ||
		options.opus !== undefined ||
		options.fable !== undefined
	);
};

const buildUpdate = (options: ConfigOptions): ProfileUpdate => {
	const update: ProfileUpdate = {};

	if (options.url !== undefined) {
		update.url = options.url;
	}

	if (options.token !== undefined) {
		update.token = options.token;
	}

	if (options.oauthToken !== undefined) {
		update.oauthToken = options.oauthToken;
	}

	if (options.haiku !== undefined) {
		update.haiku = denormalizeModelId(options.haiku);
	}

	if (options.sonnet !== undefined) {
		update.sonnet = denormalizeModelId(options.sonnet);
	}

	if (options.opus !== undefined) {
		update.opus = denormalizeModelId(options.opus);
	}

	if (options.fable !== undefined) {
		update.fable = denormalizeModelId(options.fable);
	} else if (options.opus !== undefined) {
		// Most providers expose no fable tier, so opus is mirrored until -f says otherwise.
		update.fable = denormalizeModelId(options.opus);
	}

	return update;
};

const applyProfileRecord = (
	config: CsConfig,
	name: string,
	existing: Profile | undefined,
	update: ProfileUpdate
): Profile => {
	// One name, one launcher: an alias may not shadow a profile of the same name, and the other
	// way round. The alias name stays taken until its target profile is removed.
	const aliasTarget = findAliasTarget(config, name);

	if (existing === undefined && aliasTarget !== undefined) {
		throw new CliError(`Name "${name}" is already used by an alias.`, {
			hint: `The alias points at "${aliasTarget}". Remove that profile to free the name.`,
			commands: [`cs remove ${aliasTarget}`]
		});
	}

	// Creation inherits the fields the flags leave unspecified from the default record, like
	// function default params; updates keep the profile's own values.
	const defaults = existing ?? findProfile(config, 'default') ?? OFFICIAL_PROFILE;

	const effective: Profile = {
		...EMPTY_PROFILE,
		...defaults,
		...update
	};

	// The oauth token is a login credential, not an API token: it is valid without a URL.
	if (hasTokenWithoutUrl(effective)) {
		throw new CliError(`Profile "${name}" would have a token but no URL.`, {
			hint: TOKEN_WITHOUT_URL_HINT
		});
	}

	// One profile carries one credential: two tokens would leave the winner to Claude Code.
	if (hasBothTokens(effective)) {
		throw new CliError(`Profile "${name}" cannot have both --token and --oauth-token.`, {
			hint: BOTH_TOKENS_HINT
		});
	}

	return upsertProfile(config, name, existing === undefined ? effective : update);
};

export const runConfig = async (options: ConfigOptions): Promise<ConfigResult> => {
	const name = options.name?.trim() || 'default';
	const nameError = validateProfileName(name);

	if (nameError !== null) {
		throw new CliError(nameError);
	}

	const { config, notices } = await loadCsConfig();

	if (!hasUpdates(options)) {
		const existing = findProfile(config, name);

		if (existing === undefined) {
			// A show on a missing name creates the profile with the same defaults a creation
			// applies, so the name always resolves (decision 0020). The artifact renders before
			// cs.json commits, matching the update path.
			const created = applyProfileRecord(config, name, undefined, {});

			await renderProfileArtifacts(name, created, config.env ?? {}, config.aliases ?? {});
			await saveCsConfig(config);

			return {
				kind: 'created',
				name,
				profile: created,
				artifacts: null,
				notices,
				binPath: null
			};
		}

		return {
			kind: 'shown',
			name,
			profile: existing,
			artifacts: null,
			notices,
			binPath: null
		};
	}

	const update = buildUpdate(options);
	const existing = findProfile(config, name);
	const profile = applyProfileRecord(config, name, existing, update);

	// The artifact renders before cs.json commits, so a render failure never leaves a stale
	// artifact holding the old token.
	const artifacts = await renderProfileArtifacts(name, profile, config.env ?? {}, config.aliases ?? {});

	await saveCsConfig(config);

	const binPath = await ensureBinPath();

	return {
		kind: existing === undefined ? 'created' : 'updated',
		name,
		profile,
		artifacts,
		notices,
		binPath
	};
};
