export const maskToken = (token: string): string => {
	if (!token) {
		return '<not set>'
	}

	if (token.length <= 8) {
		return `${token.slice(0, 2)}****`
	}

	return `${token.slice(0, 8)}...${token.slice(-4)}`
}

export const resolveTokenForWrite = (token: string): string => {
	return token
}

export const isEmptyToken = (token: string | undefined): boolean => {
	return !token
}

/** Normalize model ID to display name: "glm-5.1" → "Glm 5.1" */
export const normalizeModelName = (id: string): string =>
	id
		.split('-')
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(' ')
