import { mergeOpenCodeModels } from '@/config/opencode-config'
import { ModelsCache } from '@/config/types'
import { deriveModels } from '@/services/opencode-model-derive'
import { OpencodeModel, RemoteModel, RemoteModelsResponse } from '@/services/opencode-model-types'

const MODELS_ENDPOINT = 'https://ai.jjuidev.com/models'
const DEFAULT_TIMEOUT_MS = 10_000

type Fetcher = (input: string | URL | Request, init?: RequestInit) => Promise<Response>

export type FetchRemoteModelsResult =
	| { ok: true; response: RemoteModelsResponse; rawCount: number }
	| { ok: false; reason: string }

export type SyncOpenCodeModelsResult =
	| { ok: true; rawCount: number; derivedCount: number }
	| { ok: false; reason: string }

interface SyncOpenCodeModelsOptions {
	apiKey: string
	fetchRemoteModels?: (apiKey: string) => Promise<FetchRemoteModelsResult>
	readOpenCodeConfig: () => Record<string, unknown>
	writeOpenCodeConfig: (config: Record<string, unknown>) => void
	saveModelsCache: (cache: ModelsCache) => void
	pkgName: string
	now?: () => Date
	thirdPartyModelIds?: Set<string>
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null && !Array.isArray(value)

const isValidRemoteModel = (value: unknown): value is RemoteModel => {
	if (!isRecord(value) || typeof value.id !== 'string' || typeof value.name !== 'string') {
		return false
	}

	if (typeof value.version !== 'string' || typeof value.model_picker_enabled !== 'boolean') {
		return false
	}

	const capabilities = value.capabilities

	if (!isRecord(capabilities)) {
		return false
	}

	const limits = capabilities.limits
	const supports = capabilities.supports

	return (
		isRecord(limits) &&
		typeof limits.max_context_window_tokens === 'number' &&
		typeof limits.max_output_tokens === 'number' &&
		typeof limits.max_prompt_tokens === 'number' &&
		isRecord(supports) &&
		typeof supports.streaming === 'boolean' &&
		typeof supports.tool_calls === 'boolean'
	)
}

export const validateRemoteModelsResponse = (value: unknown): RemoteModelsResponse | undefined => {
	if (!isRecord(value) || !Array.isArray(value.data)) {
		return undefined
	}

	// Only validate enabled models — disabled ones are filtered out by deriveModels anyway
	const enabled = value.data.filter(
		(m: unknown) => isRecord(m) && (m as Record<string, unknown>).model_picker_enabled === true
	)

	if (!enabled.every(isValidRemoteModel)) {
		return undefined
	}

	return { data: value.data }
}

export const syncOpenCodeModelsFromRemote = async (
	options: SyncOpenCodeModelsOptions
): Promise<SyncOpenCodeModelsResult> => {
	const fetcher = options.fetchRemoteModels ?? fetchRemoteModels
	const fetched = await fetcher(options.apiKey)

	if (!fetched.ok) {
		return fetched
	}

	const config = options.readOpenCodeConfig()
	const provider = config.provider as Record<string, unknown> | undefined
	const csProvider = provider?.cs as Record<string, unknown> | undefined
	const existingModels = (csProvider?.models as Record<string, OpencodeModel> | undefined) ?? {}
	const models = deriveModels(fetched.response, existingModels, options.thirdPartyModelIds)
	const derivedCount = Object.keys(models).length

	if (derivedCount === 0) {
		return {
			ok: false,
			reason: 'No models derived from remote response'
		}
	}

	mergeOpenCodeModels(config, models, options.pkgName)
	options.writeOpenCodeConfig(config)
	options.saveModelsCache({
		updatedAt: (options.now?.() ?? new Date()).toISOString(),
		models,
		rawCount: fetched.rawCount,
		derivedCount
	})

	return {
		ok: true,
		rawCount: fetched.rawCount,
		derivedCount
	}
}

export const fetchRemoteModels = async (
	apiKey: string,
	options: { fetcher?: Fetcher; timeoutMs?: number } = {}
): Promise<FetchRemoteModelsResult> => {
	const fetcher = options.fetcher ?? fetch
	const controller = new AbortController()
	const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? DEFAULT_TIMEOUT_MS)

	try {
		const response = await fetcher(MODELS_ENDPOINT, {
			headers: { Authorization: `Bearer ${apiKey}` },
			signal: controller.signal
		})

		if (!response.ok) {
			return {
				ok: false,
				reason: `Models request failed with status ${response.status} ${response.statusText}`
			}
		}

		const body: unknown = await response.json()
		const parsed = validateRemoteModelsResponse(body)

		if (!parsed) {
			return {
				ok: false,
				reason: 'Models response has invalid shape'
			}
		}

		return {
			ok: true,
			response: parsed,
			rawCount: parsed.data.length
		}
	} catch (error) {
		const message =
			error instanceof Error && error.name === 'AbortError' ? 'Models request timed out' : 'Models request failed'

		return {
			ok: false,
			reason: message
		}
	} finally {
		clearTimeout(timeout)
	}
}
