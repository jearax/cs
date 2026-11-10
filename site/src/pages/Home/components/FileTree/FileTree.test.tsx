import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';

import { flattenTree } from '@/pages/Home/components/FileTree/file-tree.util';
import { REPOSITORY_TREE } from '@/pages/Home/constants/repository-tree.constant';

import FileTree from './FileTree';

const namesAt = (depth: number, parent?: string) => {
	return flattenTree(REPOSITORY_TREE)
		.filter((line) => {
			return line.depth === depth && (parent === undefined || line.path.startsWith(`${parent}/`));
		})
		.map((line) => {
			return line.name;
		});
};

describe('FileTree', () => {
	it('draws one line per node, under the project root', async () => {
		const screen = await render(<FileTree />);

		const lines = screen.container.querySelectorAll('[class*="line"]');

		expect(lines.length).toBe(flattenTree(REPOSITORY_TREE).length + 1);
	});

	it('lists folders before files, each by name, like an editor explorer', () => {
		expect(namesAt(0)).toEqual(['~/.claude/', '~/.config/cs/']);
		expect(namesAt(1, '~/.config/cs')).toEqual(['bin/', 'profiles/', 'cs.json']);
	});

	it('draws the branches as tree prints them', () => {
		const branchOf = (path: string) => {
			return flattenTree(REPOSITORY_TREE).find((line) => {
				return line.path === path;
			})?.branch;
		};

		expect(branchOf('~/.claude')).toBe('├── ');
		expect(branchOf('~/.claude/settings.json')).toBe('│   └── ');
		expect(branchOf('~/.config/cs/bin')).toBe('    ├── ');
		expect(branchOf('~/.config/cs/profiles/default.json')).toBe('    │   ├── ');
		expect(branchOf('~/.config/cs/profiles/work.json')).toBe('    │   └── ');
	});

	it('draws the paths a real smoke run leaves behind', async () => {
		const screen = await render(<FileTree />);

		const text = screen.container.textContent ?? '';

		for (const name of ['cs.json', 'profiles/', 'work.json', 'claude-work', 'settings.json']) {
			expect(text).toContain(name);
		}
	});
});
