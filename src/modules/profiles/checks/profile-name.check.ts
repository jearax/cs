const RESERVED_NAMES = ['__proto__', 'prototype', 'constructor'];

const NAME_PATTERN = /^[a-zA-Z0-9_-]+$/;

/** A name that reaches the filesystem, so it must not carry a separator or a traversal. */
export const validateProfileName = (name: string, label = 'Profile'): string | null => {
	if (!name || !name.trim()) {
		return `${label} name cannot be empty.`;
	}

	const trimmed = name.trim();

	if (RESERVED_NAMES.includes(trimmed)) {
		return 'Reserved name not allowed.';
	}

	if (trimmed.includes('/') || trimmed.includes('\\') || trimmed.includes('..')) {
		return `${label} name cannot contain path separators.`;
	}

	if (!NAME_PATTERN.test(trimmed)) {
		return `${label} name can only contain letters, numbers, hyphens, and underscores.`;
	}

	return null;
};

export const isValidProfileName = (name: string): boolean => {
	return validateProfileName(name) === null;
};
