import { CliError } from '@/core/errors/cli.error';
import { validateProfileName } from '@/modules/profiles/checks/profile-name.check';
import { profileArtifactExists, renderAliasLauncher } from '@/modules/profiles/services/alias-launcher.service';
import { ensureBinPath } from '@/modules/profiles/services/ensure-bin-path.service';
import { renderProfileArtifacts } from '@/modules/profiles/services/render-artifacts.service';
import {
	findAliasTarget,
	findProfile,
	loadCsConfig,
	saveCsConfig,
	setAlias
} from '@/modules/profiles/services/storage.service';

import type { BinPathOutcome } from '@/core/ui/artifact.ui';

export type AliasResult = {
	name: string;
	profile: string;
	replaced: boolean;
	launcherPath: string;
	notices: string[];
	binPath: BinPathOutcome | null;
};

export const runAlias = async (name: string, profileName: string): Promise<AliasResult> => {
	const aliasName = name.trim();
	const targetName = profileName.trim();

	const aliasError = validateProfileName(aliasName, 'Alias');

	if (aliasError !== null) {
		throw new CliError(aliasError);
	}

	const targetError = validateProfileName(targetName, 'Profile');

	if (targetError !== null) {
		throw new CliError(targetError);
	}

	const { config, notices } = await loadCsConfig();

	// One name, one launcher: an alias may not shadow a profile of the same name.
	if (findProfile(config, aliasName) !== undefined) {
		throw new CliError(`Alias "${aliasName}" collides with the profile of the same name.`, {
			hint: 'Pick another alias name, or remove the profile first.',
			commands: [`cs remove ${aliasName}`]
		});
	}

	const target = findProfile(config, targetName);

	if (target === undefined) {
		throw new CliError(`Profile "${targetName}" not found.`, {
			hint: 'Create it before aliasing it.',
			commands: [`cs config -n ${targetName} -u <url> -t <token>`]
		});
	}

	const replaced = findAliasTarget(config, aliasName) !== undefined;

	setAlias(config, aliasName, targetName);

	await saveCsConfig(config);

	// The launcher points at a rendered artifact, so a target without one is rendered first.
	if (!(await profileArtifactExists(targetName))) {
		await renderProfileArtifacts(targetName, target, config.env ?? {}, config.aliases ?? {});
	}

	const launcher = await renderAliasLauncher(aliasName, targetName);
	const binPath = await ensureBinPath();

	return {
		name: aliasName,
		profile: targetName,
		replaced,
		launcherPath: launcher,
		notices,
		binPath
	};
};
