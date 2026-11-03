import { sample } from '../../commands/alpha/services/sample.service';

export const read = (): string => {
	return sample();
};
