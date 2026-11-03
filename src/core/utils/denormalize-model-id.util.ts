/**
 * `claude-opus-4.7` → `claude-opus-4-7` (the Copilot dot form to the Anthropic dash form).
 * Only `claude-` IDs: `gpt-4.1` and `gemini-2.5-pro` keep their dots.
 */
export const denormalizeModelId = (modelId: string): string => {
	if (!modelId.startsWith('claude-')) {
		return modelId;
	}

	return modelId.replace(/^(claude-[a-z]+-\d+)\.(\d+)$/i, '$1-$2');
};
