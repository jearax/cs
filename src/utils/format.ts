/** Mask token for display: show prefix + masked middle + suffix */
export const maskToken = (token: string): string => {
	if (!token) {
		return '<not set>'
	}

	if (token.length <= 8) {
		return `${token.slice(0, 2)}****`
	}

	return `${token.slice(0, 8)}...${token.slice(-4)}`
}

/** Resolve token for writing to tool config files */
export const resolveTokenForWrite = (token: string): string => {
	return token
}

/** Check if token value should be treated as empty */
export const isEmptyToken = (token: string | undefined): boolean => {
	return !token
}

/** Normalize model ID to display name: "glm-5.1" → "Glm 5.1" */
export const normalizeModelName = (id: string): string =>
	id
		.split('-')
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(' ')
