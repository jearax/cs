/**
 * `claude-sonnet-5.5` → `claude-sonnet-5-5` (the provider dot form to the Anthropic dash form).
 * Only `claude-` IDs: `gpt-4.1` and `gemini-2.5-pro` keep their dots.
 */
export const denormalizeModelId = (modelId: string): string => {
	if (!modelId.startsWith('claude-')) {
		return modelId;
	}

	return modelId.replace(/^(claude-[a-z]+-\d+)\.(\d+)$/i, '$1-$2');
};
