import { CliError } from '@/core/errors/cli.error';
import { hasTokenWithoutUrl, TOKEN_WITHOUT_URL_HINT } from '@/modules/profiles/checks/login-mode.check';
import { validateProfileName } from '@/modules/profiles/checks/profile-name.check';
import { ensureBinPath } from '@/modules/profiles/services/ensure-bin-path.service';
import { writeProfileGlobally } from '@/modules/profiles/services/global-write.service';
import { renderProfileArtifacts } from '@/modules/profiles/services/render-artifacts.service';
import { findProfile, loadCsConfig } from '@/modules/profiles/services/storage.service';

import type { BinPathOutcome } from '@/core/ui/artifact.ui';
import type { ProfileArtifacts } from '@/modules/profiles/services/render-artifacts.service';
import type { Profile } from '@/modules/profiles/types/profile.type';

export type UseResult = {
	name: string;
	profile: Profile;
	artifacts: ProfileArtifacts;
	notices: string[];
	binPath: BinPathOutcome | null;
};

export const runUse = async (name: string): Promise<UseResult> => {
	const profileName = name.trim();
	const nameError = validateProfileName(profileName);

	if (nameError !== null) {
		throw new CliError(nameError);
	}

	const { config, notices } = await loadCsConfig();
	const profile = findProfile(config, profileName);

	if (profile === undefined) {
		throw new CliError(`Profile "${profileName}" not found.`, {
			hint: 'Run: cs config -n <name> to create it.',
			commands: [`cs config -n ${profileName} -u <url> -t <token>`]
		});
	}

	// A cs.json written before the `cs config` guard can still hold a token without a URL.
	if (hasTokenWithoutUrl(profile)) {
		throw new CliError(`Profile "${profileName}" has a token but no URL.`, {
			hint: TOKEN_WITHOUT_URL_HINT
		});
	}

	const artifacts = await renderProfileArtifacts(profileName, profile, config.env ?? {}, config.aliases ?? {});

	await writeProfileGlobally(config, profileName, profile);

	const binPath = await ensureBinPath();

	return {
		name: profileName,
		profile,
		artifacts,
		notices,
		binPath
	};
};
