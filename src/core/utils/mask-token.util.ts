/** A secret never reaches the terminal in full: only its edges are shown. */
export const maskToken = (token: string): string => {
	if (!token) {
		return '<not set>';
	}

	if (token.length <= 8) {
		return `${token.slice(0, 2)}****`;
	}

	// Up to twelve characters the head-8 and tail-4 windows would overlap and expose everything.
	if (token.length <= 12) {
		return `${token.slice(0, 4)}****`;
	}

	return `${token.slice(0, 8)}...${token.slice(-4)}`;
};
