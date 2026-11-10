import CodeBlock from '@/components/CodeBlock/CodeBlock';
import CopyButton from '@/components/CopyButton/CopyButton';
import { INSTALL_COMMAND } from '@/constants/cli.constant';
import DocPage from '@/pages/Docs/components/DocPage/DocPage';
import { meta } from '@/pages/Docs/pages/GettingStarted/GettingStarted.constant';

const GettingStarted = () => {
	return (
		<DocPage
			title="Getting started"
			summary="What cs is, and how a profile works."
			sections={[
				{
					...meta('what-it-is'),
					body: (
						<>
							<p>
								<code>cs</code> &mdash; Claude code switch &mdash; moves Claude Code between API providers and model
								sets without hand-editing settings. It keeps named profiles in <code>~/.config/cs/cs.json</code>, and
								one command switches the active one.
							</p>
							<p>
								A profile carries a base URL, one credential and the four model IDs. Switching profiles switches the
								auth mode Claude Code resolves: a paid-API profile, an oauth profile, or the empty default profile that
								falls back to <code>/login</code>.
							</p>
						</>
					)
				},
				{
					...meta('two-deliveries'),
					body: (
						<>
							<p>
								The delivery is dual. <code>cs use</code> writes <code>~/.claude/settings.json</code> for the whole
								machine, and every profile also renders <code>~/.config/cs/profiles/&lt;name&gt;.json</code>, which a
								launcher loads for one session only.
							</p>
							<p>
								Both targets come from the same renderer, so a profile behaves the same either way. Only{' '}
								<code>cs alias</code> creates the <code>claude-&lt;name&gt;</code> launchers.
							</p>
						</>
					)
				},
				{
					...meta('first-run'),
					body: (
						<>
							<p>Install it.</p>
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
							<p>Create a profile. A new one fills its unspecified fields from the default record.</p>
							<CodeBlock
								code="cs config -n work -u https://api.anthropic.com -t sk-ant-..."
								language="sh"
								prompt={{
									dir: '~',
									git: false
								}}
								title="config"
								headerAction={
									<CopyButton
										feedback="icon"
										label="Copy the config command"
										value="cs config -n work -u https://api.anthropic.com -t sk-ant-..."
									/>
								}
							/>
							<p>Switch to it, and see what is active.</p>
							<CodeBlock
								code="cs use work && cs current"
								language="sh"
								prompt={{
									dir: '~',
									git: false
								}}
								title="use"
								headerAction={
									<CopyButton feedback="icon" label="Copy the use command" value="cs use work && cs current" />
								}
							/>
						</>
					)
				},
				{
					...meta('next'),
					body: (
						<ul>
							<li>
								<a href="/docs/install">Install</a> &mdash; what the installer needs and where it writes.
							</li>
							<li>
								<a href="/docs/reference">Reference</a> &mdash; every command, option, auth mode and exit code.
							</li>
						</ul>
					)
				}
			]}
		/>
	);
};

export default GettingStarted;
