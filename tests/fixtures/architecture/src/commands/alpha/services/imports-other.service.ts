import { beta } from '../../beta/services/beta.service';

export const read = (): string => {
	return beta();
};
