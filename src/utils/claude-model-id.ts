/**
 * `claude-opus-4.7` → `claude-opus-4-7` (Copilot dot form to Anthropic dash form).
 * Only `claude-` IDs: `gpt-4.1`, `gemini-2.5-pro` stay dotted.
 */
export const denormalizeModelId = (modelId: string): string => {
	if (!modelId.startsWith('claude-')) {
		return modelId
	}

	return modelId.replace(/^(claude-[a-z]+-\d+)\.(\d+)$/i, '$1-$2')
}

/**
 * `claude-opus-4-7` → `claude-opus-4.7` (Anthropic dash form to Copilot dot form).
 * Only `claude-` IDs, so dated IDs like `gpt-5-2024-08-06` are untouched.
 */
export const normalizeAnthropicModelId = (modelId: string): string => {
	if (!modelId.startsWith('claude-')) {
		return modelId
	}

	return modelId.replace(/^(claude-[a-z]+-\d+)-(\d+)$/i, '$1.$2')
}
