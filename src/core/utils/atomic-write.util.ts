import { chmod, mkdir, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

/**
 * Writes through a same-directory temp file and a rename, so a crash can never leave a truncated
 * file at the target path.
 */
export const atomicWriteFile = async (path: string, data: string, mode: number): Promise<void> => {
	await mkdir(dirname(path), { recursive: true });

	const tempPath = `${path}.tmp`;

	await writeFile(tempPath, data, { mode });
	// The mode of writeFile only applies when the file is created, so it is enforced here.
	await chmod(tempPath, mode);
	await rename(tempPath, path);
};
