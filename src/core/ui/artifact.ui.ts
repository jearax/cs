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
	if (outcome.status === 'added') {
		return [`PATH entry added to ${outcome.rcPath} — open a new shell to pick it up`];
	}

	if (outcome.status === 'not-interactive' || outcome.status === 'unsupported-shell') {
		const hint =
			outcome.rcPath === null ? `  ${outcome.exportLine}` : `  ${outcome.exportLine}   (add it to ${outcome.rcPath})`;

		return ['Add ~/.config/cs/bin to your PATH to run the launchers:', hint];
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
