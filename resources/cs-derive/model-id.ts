/**
 * Reverse of `normalizeModelId` in src/modules/copilot/services/sanitizer.service.ts.
 *
 * Convert Copilot registry id (dot version) → claude CLI / Anthropic-style id
 * (dash version):
 *
 *   claude-opus-4.7   → claude-opus-4-7
 *   claude-sonnet-4.5 → claude-sonnet-4-5
 *
 * Restricted to `claude-` prefix to avoid touching IDs like `gpt-5.5`,
 * `gemini-2.5-pro`, `gpt-4.1` whose canonical form remains dotted.
 */
export const denormalizeModelId = (modelId: string): string => {
	if (!modelId.startsWith('claude-')) {
		return modelId
	}

	return modelId.replace(/^(claude-[a-z]+-\d+)\.(\d+)$/i, '$1-$2')
}


/**
 * Normalize model id: `claude-{name}-{N}-{M}` → `claude-{name}-{N}.{M}`.
 *
 * Some clients (e.g. claude CLI) emit version with dash (`claude-opus-4-7`),
 * while Copilot registry uses dot (`claude-opus-4.7`). Restricted to `claude-`
 * prefix to avoid touching IDs like `gpt-5-2024-08-06`.
 */
const normalizeAnthropicModelId = (modelId: string): string => {
	if (!modelId.startsWith('claude-')) {
		return modelId
	}

	return modelId.replace(/^(claude-[a-z]+-\d+)-(\d+)$/i, '$1.$2')
}
