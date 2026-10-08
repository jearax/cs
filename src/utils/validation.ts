import { logger } from '@/utils/logger'

export const validateProfileName = (name: string): string | null => {
	if (!name || !name.trim()) {
		return 'Profile name cannot be empty.'
	}

	const trimmed = name.trim()

	if (trimmed === '__proto__' || trimmed === 'prototype' || trimmed === 'constructor') {
		return 'Reserved name not allowed.'
	}

	if (trimmed.includes('/') || trimmed.includes('\\') || trimmed.includes('..')) {
		return 'Profile name cannot contain path separators.'
	}

	if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
		return 'Profile name can only contain letters, numbers, hyphens, and underscores.'
	}

	return null
}

export const safeJsonParse = <T>(content: string, filePath: string): T | null => {
	try {
		return JSON.parse(content) as T
	} catch {
		logger.error(`Failed to parse ${filePath}. File may be corrupted.`)
		return null
	}
}
