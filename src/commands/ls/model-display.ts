import { ModelsCache } from '@/config/types'
import { OpencodeModel } from '@/services/opencode-model-types'

export const filterModelsForDisplay = (
	models: Record<string, OpencodeModel>,
	vendor?: string
): Record<string, OpencodeModel> => {
	const normalizedVendor = vendor?.trim().toLowerCase()

	if (!normalizedVendor) {
		return models
	}

	return Object.fromEntries(
		Object.entries(models).filter(([, model]) => model.vendor?.toLowerCase() === normalizedVendor)
	)
}

export const getModelsCacheCount = (cache: ModelsCache): number => Object.keys(cache.models).length

export const hasModelsCache = (cache: ModelsCache): boolean => getModelsCacheCount(cache) > 0

export const shouldPromptForEmptyCache = (cache: ModelsCache, isInteractive: boolean): boolean =>
	!hasModelsCache(cache) && isInteractive
