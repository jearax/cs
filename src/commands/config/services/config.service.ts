import { CliError } from '@/core/errors/cli.error';
import { denormalizeModelId } from '@/core/utils/denormalize-model-id.util';
import { hasTokenWithoutUrl, TOKEN_WITHOUT_URL_HINT } from '@/modules/profiles/checks/login-mode.check';
import { validateProfileName } from '@/modules/profiles/checks/profile-name.check';
import { BOTH_TOKENS_HINT, hasBothTokens } from '@/modules/profiles/checks/token-exclusivity.check';
import { EMPTY_PROFILE } from '@/modules/profiles/constants/profile.constant';
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
import type { Profile, ProfileUpdate } from '@/modules/profiles/types/profile.type';

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
	kind: 'shown' | 'updated';
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

export const runConfig = async (options: ConfigOptions): Promise<ConfigResult> => {
	const name = options.name?.trim() || 'default';
	const nameError = validateProfileName(name);

	if (nameError !== null) {
		throw new CliError(nameError);
	}

	const { config, notices } = await loadCsConfig();

	if (!hasUpdates(options)) {
		const profile = findProfile(config, name);

		if (profile === undefined) {
			throw new CliError(`Profile "${name}" not found.`, {
				hint: `Create it: cs config -n ${name} -u <url>`,
				commands: [`cs config -n ${name} -u <url> -t <token>`]
			});
		}

		return {
			kind: 'shown',
			name,
			profile,
			artifacts: null,
			notices,
			binPath: null
		};
	}

	const update = buildUpdate(options);
	const existing = findProfile(config, name);

	// One name, one launcher: an alias may not shadow a profile of the same name, and the other
	// way round. The alias name stays taken until its target profile is removed.
	const aliasTarget = findAliasTarget(config, name);

	if (existing === undefined && aliasTarget !== undefined) {
		throw new CliError(`Name "${name}" is already used by an alias.`, {
			hint: `The alias points at "${aliasTarget}". Remove that profile to free the name.`,
			commands: [`cs remove ${aliasTarget}`]
		});
	}

	const effective: Profile = {
		...EMPTY_PROFILE,
		...existing,
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

	const profile = upsertProfile(config, name, update);

	await saveCsConfig(config);

	const artifacts = await renderProfileArtifacts(name, profile, config.env ?? {}, config.aliases ?? {});
	const binPath = await ensureBinPath();

	return {
		kind: 'updated',
		name,
		profile,
		artifacts,
		notices,
		binPath
	};
};
