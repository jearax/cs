import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { chmod, mkdir, readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { makeEmptyDir, removeDir } from './support/tmp-dir';

const run = promisify(execFile);
const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const installScript = resolve(projectRoot, 'scripts/install.sh');

type CommandResult = {
	code: number;
	stdout: string;
	stderr: string;
};

type ReleaseServer = {
	baseUrl: string;
	close: () => Promise<void>;
};

type Manifest = { version: string; engines: { node: string } };

const runShell = async (
	file: string,
	args: readonly string[],
	env: NodeJS.ProcessEnv,
	cwd?: string
): Promise<CommandResult> => {
	try {
		const { stdout, stderr } = await run(file, [...args], {
			env,
			cwd
		});

		return {
			code: 0,
			stdout,
			stderr
		};
	} catch (error) {
		const failure = error as { code?: number; stdout?: string; stderr?: string };

		return {
			code: failure.code ?? -1,
			stdout: failure.stdout ?? '',
			stderr: failure.stderr ?? ''
		};
	}
};

const startReleaseServer = async (
	bundle: Buffer,
	checksums: (digest: string) => string,
	paths: { bundle?: string; checksums?: string } = {}
): Promise<ReleaseServer> => {
	const bundlePath = paths.bundle ?? '/releases/latest/cli.mjs';
	const checksumsPath = paths.checksums ?? '/releases/latest/checksums.txt';

	const server = createServer((request, response) => {
		const path = request.url ?? '/';

		if (path === bundlePath) {
			response.writeHead(200, { 'content-type': 'application/octet-stream' });
			response.end(bundle);

			return;
		}

		if (path === checksumsPath) {
			response.writeHead(200, { 'content-type': 'text/plain' });
			response.end(checksums(createHash('sha256').update(bundle).digest('hex')));

			return;
		}

		response.writeHead(404);
		response.end('not found');
	});

	await new Promise<void>((resolveListen) => {
		server.listen(0, '127.0.0.1', resolveListen);
	});

	const address = server.address();

	if (address === null || typeof address === 'string') {
		throw new Error('the release server did not bind to a TCP port');
	}

	const close = async (): Promise<void> => {
		await new Promise<void>((resolveClose) => {
			server.close(() => {
				resolveClose();
			});
		});
	};

	return {
		baseUrl: `http://127.0.0.1:${address.port}`,
		close
	};
};

describe('install.sh', () => {
	let bundle: Buffer;
	let manifest: Manifest;
	let release: ReleaseServer;
	let tampered: ReleaseServer;
	let unlisted: ReleaseServer;
	let unversioned: ReleaseServer;
	let traversing: ReleaseServer;

	beforeAll(async () => {
		bundle = await readFile(resolve(projectRoot, 'dist/cli.mjs'));
		manifest = JSON.parse(await readFile(resolve(projectRoot, 'package.json'), 'utf8')) as Manifest;
		release = await startReleaseServer(bundle, (digest) => {
			return `${digest}  cli.mjs\n`;
		});
		tampered = await startReleaseServer(bundle, () => {
			return `${'0'.repeat(64)}  cli.mjs\n`;
		});
		unlisted = await startReleaseServer(bundle, () => {
			return `${'0'.repeat(64)}  other.mjs\n`;
		});
		unversioned = await startReleaseServer(Buffer.from("console.log('not-a-version');\n"), (digest) => {
			return `${digest}  cli.mjs\n`;
		});
		traversing = await startReleaseServer(Buffer.from("console.log('../../../../tmp/pwned');\n"), (digest) => {
			return `${digest}  cli.mjs\n`;
		});
	});

	afterAll(async () => {
		await release.close();
		await tampered.close();
		await unlisted.close();
		await unversioned.close();
		await traversing.close();
	});

	const installEnv = (baseUrl: string, sandbox: string, path?: string): NodeJS.ProcessEnv => {
		return {
			PATH: path ?? process.env['PATH'] ?? '',
			HOME: sandbox,
			CS_BASE_URL: `${baseUrl}/releases/latest`,
			CS_HOME: resolve(sandbox, 'home'),
			CS_BIN_DIR: resolve(sandbox, 'bin')
		};
	};

	it('installs the CLI and runs it', async () => {
		const sandbox = await makeEmptyDir();

		try {
			const result = await runShell('sh', [installScript], installEnv(release.baseUrl, sandbox));

			expect(result.code).toBe(0);
			expect(result.stdout).toContain(`installed cs ${manifest.version}`);

			const shim = resolve(sandbox, 'bin', 'cs');

			expect(existsSync(shim)).toBe(true);
			expect(existsSync(resolve(sandbox, 'home', manifest.version, 'cli.mjs'))).toBe(true);

			const version = await runShell(shim, ['--version'], installEnv(release.baseUrl, sandbox));

			expect(version.code).toBe(0);
			expect(version.stdout.trim()).toBe(manifest.version);
		} finally {
			await removeDir(sandbox);
		}
	});

	it('runs the bundle through node, not a link to it', async () => {
		const sandbox = await makeEmptyDir();

		try {
			await runShell('sh', [installScript], installEnv(release.baseUrl, sandbox));

			const shim = await readFile(resolve(sandbox, 'bin', 'cs'), 'utf8');

			expect(shim).toContain('exec node');
			expect(shim).toContain(resolve(sandbox, 'home', manifest.version, 'cli.mjs'));
		} finally {
			await removeDir(sandbox);
		}
	});

	it('installs into a home that holds neither the store nor the bin dir', async () => {
		const sandbox = await makeEmptyDir();

		try {
			const result = await runShell('sh', [installScript], installEnv(release.baseUrl, sandbox));

			expect(result.code).toBe(0);
			expect(existsSync(resolve(sandbox, 'home', manifest.version, 'cli.mjs'))).toBe(true);
			expect(existsSync(resolve(sandbox, 'bin', 'cs'))).toBe(true);
		} finally {
			await removeDir(sandbox);
		}
	});

	it('installs into a path that holds a space', async () => {
		const sandbox = await makeEmptyDir();
		const spaced = resolve(sandbox, 'dir with spaces');

		try {
			await mkdir(spaced, { recursive: true });

			const env = {
				...installEnv(release.baseUrl, sandbox),
				CS_HOME: resolve(spaced, 'home'),
				CS_BIN_DIR: resolve(spaced, 'bin')
			};

			const result = await runShell('sh', [installScript], env);

			expect(result.code).toBe(0);

			const version = await runShell(resolve(spaced, 'bin', 'cs'), ['--version'], env);

			expect(version.code).toBe(0);
			expect(version.stdout.trim()).toBe(manifest.version);
		} finally {
			await removeDir(sandbox);
		}
	});

	it('resolves a relative install path before it writes the shim', async () => {
		const sandbox = await makeEmptyDir();

		try {
			const env = {
				...installEnv(release.baseUrl, sandbox),
				CS_HOME: 'home',
				CS_BIN_DIR: 'bin'
			};

			const result = await runShell('sh', [installScript], env, sandbox);

			expect(result.code).toBe(0);

			const shim = await readFile(resolve(sandbox, 'bin', 'cs'), 'utf8');

			expect(shim).toContain(resolve(sandbox, 'home', manifest.version, 'cli.mjs'));
		} finally {
			await removeDir(sandbox);
		}
	});

	it('refuses a home that is not set', async () => {
		const sandbox = await makeEmptyDir();

		try {
			const env = installEnv(release.baseUrl, sandbox);

			delete env['HOME'];

			const result = await runShell('sh', [installScript], env);

			expect(result.code).not.toBe(0);
			expect(result.stderr).toContain('HOME is not set');
		} finally {
			await removeDir(sandbox);
		}
	});

	it('refuses a download that fails', async () => {
		const sandbox = await makeEmptyDir();

		try {
			const env = {
				...installEnv(release.baseUrl, sandbox),
				CS_BASE_URL: `${release.baseUrl}/releases/missing`
			};

			const result = await runShell('sh', [installScript], env);

			expect(result.code).not.toBe(0);
			expect(result.stderr).toContain('download of cli.mjs failed');
			expect(existsSync(resolve(sandbox, 'home'))).toBe(false);
		} finally {
			await removeDir(sandbox);
		}
	});

	it('installs again over an existing install', async () => {
		const sandbox = await makeEmptyDir();

		try {
			await runShell('sh', [installScript], installEnv(release.baseUrl, sandbox));

			const second = await runShell('sh', [installScript], installEnv(release.baseUrl, sandbox));

			expect(second.code).toBe(0);

			const version = await runShell(
				resolve(sandbox, 'bin', 'cs'),
				['--version'],
				installEnv(release.baseUrl, sandbox)
			);

			expect(version.code).toBe(0);
			expect(version.stdout.trim()).toBe(manifest.version);
		} finally {
			await removeDir(sandbox);
		}
	});

	it('refuses a checksum mismatch and installs nothing', async () => {
		const sandbox = await makeEmptyDir();

		try {
			const result = await runShell('sh', [installScript], installEnv(tampered.baseUrl, sandbox));

			expect(result.code).not.toBe(0);
			expect(result.stderr).toContain('checksum mismatch');
			expect(existsSync(resolve(sandbox, 'bin', 'cs'))).toBe(false);
			expect(existsSync(resolve(sandbox, 'home'))).toBe(false);
		} finally {
			await removeDir(sandbox);
		}
	});

	it('refuses a checksum file with no entry for the bundle', async () => {
		const sandbox = await makeEmptyDir();

		try {
			const result = await runShell('sh', [installScript], installEnv(unlisted.baseUrl, sandbox));

			expect(result.code).not.toBe(0);
			expect(result.stderr).toContain('checksums.txt has no entry for cli.mjs');
			expect(existsSync(resolve(sandbox, 'home'))).toBe(false);
		} finally {
			await removeDir(sandbox);
		}
	});

	it.each([
		[
			'a bare file name',
			(digest: string) => {
				return `${digest}  cli.mjs\n`;
			}
		],
		[
			'a path',
			(digest: string) => {
				return `${digest}  release/cli.mjs\n`;
			}
		],
		[
			'the binary marker of sha256sum',
			(digest: string) => {
				return `${digest} *cli.mjs\n`;
			}
		]
	])('reads a checksum file that lists the bundle with %s', async (_label, checksums) => {
		const sandbox = await makeEmptyDir();
		const server = await startReleaseServer(bundle, checksums);

		try {
			const result = await runShell('sh', [installScript], installEnv(server.baseUrl, sandbox));

			expect(result.code).toBe(0);
			expect(result.stdout).toContain(`installed cs ${manifest.version}`);
		} finally {
			await server.close();
			await removeDir(sandbox);
		}
	});

	it('refuses a bundle that reports no usable version', async () => {
		const sandbox = await makeEmptyDir();

		try {
			const result = await runShell('sh', [installScript], installEnv(unversioned.baseUrl, sandbox));

			expect(result.code).not.toBe(0);
			expect(result.stderr).toContain('invalid version');
			expect(existsSync(resolve(sandbox, 'home'))).toBe(false);
			expect(existsSync(resolve(sandbox, 'bin', 'cs'))).toBe(false);
		} finally {
			await removeDir(sandbox);
		}
	});

	it('refuses a version that would escape the install directory', async () => {
		const sandbox = await makeEmptyDir();

		try {
			const result = await runShell('sh', [installScript], installEnv(traversing.baseUrl, sandbox));

			expect(result.code).not.toBe(0);
			expect(result.stderr).toContain('invalid version');
			expect(existsSync(resolve(sandbox, 'home'))).toBe(false);
			expect(existsSync('/tmp/pwned')).toBe(false);
		} finally {
			await removeDir(sandbox);
		}
	});

	it.each(['0.1.0', '1.0.0', '10.20.30', '1.0.0-rc.1', '0.2.0-beta.2'])(
		'installs a version shaped like %s',
		async (version) => {
			const sandbox = await makeEmptyDir();

			const server = await startReleaseServer(Buffer.from(`console.log('${version}');\n`), (digest) => {
				return `${digest}  cli.mjs\n`;
			});

			try {
				const result = await runShell('sh', [installScript], installEnv(server.baseUrl, sandbox));

				expect(result.code).toBe(0);
				expect(existsSync(resolve(sandbox, 'home', version, 'cli.mjs'))).toBe(true);
			} finally {
				await server.close();
				await removeDir(sandbox);
			}
		}
	);

	it.each(['', '1', '1.0', '1.0.0.0', '..', '../../etc/passwd', 'a.b.c', '1.0.0-', '.1.0', '1.0.'])(
		'refuses the version %j',
		async (version) => {
			const sandbox = await makeEmptyDir();

			const server = await startReleaseServer(Buffer.from(`console.log('${version}');\n`), (digest) => {
				return `${digest}  cli.mjs\n`;
			});

			try {
				const result = await runShell('sh', [installScript], installEnv(server.baseUrl, sandbox));

				expect(result.code).not.toBe(0);
				expect(result.stderr).toContain('invalid version');
				expect(existsSync(resolve(sandbox, 'home'))).toBe(false);
			} finally {
				await server.close();
				await removeDir(sandbox);
			}
		}
	);

	it('refuses a Node below the floor, before it downloads anything', async () => {
		const sandbox = await makeEmptyDir();
		const fakeBin = resolve(sandbox, 'fake-bin');
		const fakeNode = resolve(fakeBin, 'node');

		try {
			await mkdir(fakeBin, { recursive: true });
			await writeFile(fakeNode, '#!/bin/sh\necho v18.0.0\n');
			await chmod(fakeNode, 0o755);

			const result = await runShell(
				'sh',
				[installScript],
				installEnv(release.baseUrl, sandbox, `${fakeBin}:${process.env['PATH'] ?? ''}`)
			);

			expect(result.code).not.toBe(0);
			expect(result.stderr).toContain(`node >= ${manifest.engines.node.replace(/^>=/, '')} is required`);
			expect(result.stdout).not.toContain('downloading from');
		} finally {
			await removeDir(sandbox);
		}
	});

	it('declares the same Node floor as engines.node', async () => {
		const script = await readFile(installScript, 'utf8');
		const floor = /^MIN_NODE_VERSION="([^"]+)"$/m.exec(script)?.[1];

		expect(floor).toBeDefined();
		expect(floor).toBe(manifest.engines.node.replace(/^>=/, ''));
	});

	it('shows the usage on --help and writes nothing', async () => {
		const sandbox = await makeEmptyDir();

		try {
			const result = await runShell('sh', [installScript, '--help'], installEnv(release.baseUrl, sandbox));

			expect(result.code).toBe(0);
			expect(result.stdout).toContain('Usage: install.sh');
			expect(existsSync(resolve(sandbox, 'home'))).toBe(false);
			expect(existsSync(resolve(sandbox, 'bin'))).toBe(false);
		} finally {
			await removeDir(sandbox);
		}
	});

	it('refuses an argument it does not take', async () => {
		const sandbox = await makeEmptyDir();

		try {
			const result = await runShell('sh', [installScript, 'nope'], installEnv(release.baseUrl, sandbox));

			expect(result.code).not.toBe(0);
			expect(result.stderr).toContain("unexpected argument 'nope'");
			expect(existsSync(resolve(sandbox, 'home'))).toBe(false);
		} finally {
			await removeDir(sandbox);
		}
	});
});
