import CodeBlock from '@/components/CodeBlock/CodeBlock';
import CopyButton from '@/components/CopyButton/CopyButton';
import { INSTALL_COMMAND, NODE_FLOOR, REQUIREMENTS } from '@/constants/cli.constant';
import DocPage from '@/pages/Docs/components/DocPage/DocPage';
import RichText from '@/pages/Docs/components/RichText/RichText';
import { meta } from '@/pages/Docs/pages/Install/Install.constant';

const INSTALL_PATHS: readonly { label: string; value: string }[] = [
	{
		label: 'The bundle',
		value: '~/.cs/<version>/cli.mjs'
	},
	{
		label: 'The command',
		value: '~/.local/bin/cs'
	}
];

const INSTALL_ENV: readonly { name: string; meaning: string }[] = [
	{
		name: 'CS_BASE_URL',
		meaning: 'Where the bundle is downloaded from. Defaults to `https://cs.jjuidev.com/releases/latest`.'
	},
	{
		name: 'CS_HOME',
		meaning: 'Where the bundle is installed. Defaults to `~/.cs`.'
	},
	{
		name: 'CS_BIN_DIR',
		meaning: 'Where the command is written. Defaults to `~/.local/bin`.'
	}
];

const Install = () => {
	return (
		<DocPage
			title="Install"
			summary="The install command, what it needs, and what it writes."
			sections={[
				{
					...meta('the-command'),
					body: (
						<>
							<p>
								One line, no sudo, nothing else to run. The installer is a POSIX shell script the site serves; it
								downloads the self-contained bundle and its checksum, verifies the checksum before writing anything, and
								installs <code>cs</code> for the current user.
							</p>
							<CodeBlock
								code={INSTALL_COMMAND}
								language="sh"
								prompt={{
									dir: '~',
									git: false
								}}
								title="install.sh"
								wrap
								headerAction={<CopyButton feedback="icon" label="Copy the install command" value={INSTALL_COMMAND} />}
							/>
						</>
					)
				},
				{
					...meta('what-it-needs'),
					body: (
						<>
							<ul>
								{REQUIREMENTS.map((requirement) => {
									return (
										<li key={requirement}>
											<RichText text={requirement} />
										</li>
									);
								})}
							</ul>
							<p>
								The Node floor is enforced by the installer itself, before the download. The script needs{' '}
								<code>curl</code> or <code>wget</code>, and a way to check a checksum: <code>sha256sum</code> or{' '}
								<code>shasum</code>. Nothing is cloned and nothing is built: the download is one file that carries its
								own runtime dependencies, so there is no <code>node_modules</code> to install beside it.
							</p>
						</>
					)
				},
				{
					...meta('what-it-writes'),
					body: (
						<>
							<p>Two paths, both under your home directory. Nothing else on the machine is touched.</p>
							<table>
								<thead>
									<tr>
										<th scope="col">What</th>
										<th scope="col">Where</th>
									</tr>
								</thead>
								<tbody>
									{INSTALL_PATHS.map((path) => {
										return (
											<tr key={path.label}>
												<td>{path.label}</td>
												<td>
													<code>{path.value}</code>
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
							<p>
								The command in <code>~/.local/bin</code> is a small shell script that runs the bundle in place, not a
								symlink, so the CLI never has to resolve a link.
							</p>
							<p>
								The store <code>~/.config/cs/cs.json</code>, the rendered profiles and the launchers are cs&rsquo;s own
								work, on the first <code>cs config</code>, <code>cs use</code> or <code>cs alias</code> &mdash; the
								installer writes none of them.
							</p>
						</>
					)
				},
				{
					...meta('moving-it'),
					body: (
						<>
							<p>Three environment variables move the locations:</p>
							<table>
								<thead>
									<tr>
										<th scope="col">Variable</th>
										<th scope="col">What it changes</th>
									</tr>
								</thead>
								<tbody>
									{INSTALL_ENV.map((entry) => {
										return (
											<tr key={entry.name}>
												<td>
													<code>{entry.name}</code>
												</td>
												<td>
													<RichText text={entry.meaning} />
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</>
					)
				},
				{
					...meta('uninstall'),
					body: (
						<p>
							Remove the two paths above: <code>~/.local/bin/cs</code> and <code>~/.cs</code>. The installer writes
							nothing else, so there is nothing else to clean up.
						</p>
					)
				},
				{
					...meta('from-source'),
					body: (
						<p>
							Building from source needs <code>git</code>, <code>pnpm</code> and the Node floor:{' '}
							<code>git clone https://github.com/jearax/cs</code>, then <code>pnpm install</code>,{' '}
							<code>pnpm build</code>, <code>pnpm link</code>. The installer path needs none of those.
						</p>
					)
				},
				{
					...meta('the-floor'),
					body: (
						<p>
							The floor is <code>{NODE_FLOOR}</code>. It is declared once, in the package manifest, and the served
							script carries a copy because a shell script cannot read a manifest. The repository&rsquo;s test holds the
							two together.
						</p>
					)
				}
			]}
		/>
	);
};

export default Install;
