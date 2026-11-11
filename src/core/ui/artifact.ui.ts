export type ArtifactView = {
	settingsHomePath: string;
	launchCommand: string;
};

export const artifactLines = (artifacts: ArtifactView, indent = '  '): string[] => {
	return [`${indent}Settings: ${artifacts.settingsHomePath}`, `${indent}Command:  ${artifacts.launchCommand}`];
};

/** What the PATH service did with the shell rc, and what the user still has to do. */
export type BinPathOutcome = {
	status: 'added' | 'already-in-path' | 'marker-present' | 'not-interactive' | 'unsupported-shell';
	rcPath: string | null;
	exportLine: string;
};

export const binPathNoticeLines = (outcome: BinPathOutcome, indent = '  '): string[] => {
	/*
	 * One line, one voice: `PATH:     <what>` pads the label to the same 10-wide column as
	 * `Launcher:`, so the tail block lines up; the no-op statuses stay silent. The indent follows
	 * the block the notice closes: under a `Profile:` header it is indented, after a banner it is not.
	 */
	if (outcome.status === 'added') {
		return [`${indent}PATH:     added to ${outcome.rcPath} — open a new shell to pick it up`];
	}

	if (outcome.status === 'marker-present') {
		return [`${indent}PATH:     entry is in ${outcome.rcPath} — open a new shell to pick it up`];
	}

	if (outcome.status === 'not-interactive' || outcome.status === 'unsupported-shell') {
		const target = outcome.rcPath === null ? 'your shell rc' : outcome.rcPath;

		return [`${indent}PATH:     not written — add it to ${target}: ${outcome.exportLine}`];
	}

	return [];
};

export const showBinPathNotice = (outcome: BinPathOutcome | null, indent?: string): void => {
	if (outcome === null) {
		return;
	}

	const lines = binPathNoticeLines(outcome, indent);

	if (lines.length === 0) {
		return;
	}

	process.stdout.write(`${lines.join('\n')}\n`);
};
