export type ArtifactView = {
	settingsHomePath: string;
	launchCommand: string;
};

export const artifactLines = (artifacts: ArtifactView): string[] => {
	return [`  Settings: ${artifacts.settingsHomePath}`, `  Command:  ${artifacts.launchCommand}`];
};

/** What the PATH service did with the shell rc, and what the user still has to do. */
export type BinPathOutcome = {
	status: 'added' | 'already-in-path' | 'marker-present' | 'not-interactive' | 'unsupported-shell';
	rcPath: string | null;
	exportLine: string;
};

export const binPathNoticeLines = (outcome: BinPathOutcome): string[] => {
	/*
	 * One line, one voice, whatever the PATH service did: every line reads `  PATH: <what>` in the
	 * same two-space indent as `Launcher:`, so the command's tail block is uniform across runs.
	 * The statuses with nothing to do stay silent.
	 */
	if (outcome.status === 'added') {
		return [`  PATH: added to ${outcome.rcPath} — open a new shell to pick it up`];
	}

	if (outcome.status === 'marker-present') {
		return [`  PATH: entry is in ${outcome.rcPath} — open a new shell to pick it up`];
	}

	if (outcome.status === 'not-interactive' || outcome.status === 'unsupported-shell') {
		const target = outcome.rcPath === null ? 'your shell rc' : outcome.rcPath;

		return [`  PATH: not written — add it to ${target}: ${outcome.exportLine}`];
	}

	return [];
};

export const showBinPathNotice = (outcome: BinPathOutcome | null): void => {
	if (outcome === null) {
		return;
	}

	const lines = binPathNoticeLines(outcome);

	if (lines.length === 0) {
		return;
	}

	process.stdout.write(`${lines.join('\n')}\n`);
};
