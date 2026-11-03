import { alpha } from './services/alpha.service';

export const read = (): string => {
	return alpha();
};
