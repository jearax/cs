import { Fragment } from 'react';

import { COMMANDS } from '@/constants/commands.constant';
import { ARTIFACTS, CONFIG_OPTIONS, EXIT_CODES } from '@/constants/reference.constant';
import DocPage from '@/pages/Docs/components/DocPage/DocPage';
import RichText from '@/pages/Docs/components/RichText/RichText';
import { meta } from '@/pages/Docs/pages/Reference/Reference.constant';

const AUTH_MODES: readonly { url: string; token: string; oauth: string; csWrites: string }[] = [
	{
		url: 'set',
		token: '—',
		oauth: '—',
		csWrites: '`ANTHROPIC_BASE_URL` only'
	},
	{
		url: 'set',
		token: 'set',
		oauth: '—',
		csWrites: '`ANTHROPIC_BASE_URL` + `ANTHROPIC_AUTH_TOKEN`'
	},
	{
		url: 'set',
		token: '—',
		oauth: 'set',
		csWrites: '`ANTHROPIC_BASE_URL` + `CLAUDE_CODE_OAUTH_TOKEN`'
	},
	{
		url: '—',
		token: '—',
		oauth: 'set',
		csWrites: '`CLAUDE_CODE_OAUTH_TOKEN` only'
	}
];

const Reference = () => {
	return (
		<DocPage
			title="Reference"
			summary="The commands, the options, the auth modes and the exit codes."
			sections={[
				{
					...meta('the-commands'),
					body: (
						<table>
							<thead>
								<tr>
									<th scope="col">Command</th>
									<th scope="col">What it does</th>
								</tr>
							</thead>
							<tbody>
								{COMMANDS.map((command) => {
									return (
										<tr key={command.name}>
											<td>
												<code>cs {command.name}</code>
												{command.aliases?.map((alias) => {
													return (
														<Fragment key={alias}>
															{' '}
															(<code>{alias}</code>)
														</Fragment>
													);
												})}
											</td>
											<td>
												<RichText text={command.summary} />
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					)
				},
				{
					...meta('the-options'),
					body: (
						<table>
							<thead>
								<tr>
									<th scope="col">Option</th>
									<th scope="col">What it does</th>
								</tr>
							</thead>
							<tbody>
								{CONFIG_OPTIONS.map((option) => {
									return (
										<tr key={option.flag}>
											<td>
												<code>{option.flag}</code>
											</td>
											<td>
												<RichText text={option.meaning} />
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					)
				},
				{
					...meta('the-auth-modes'),
					body: (
						<>
							<p>
								One token per profile: <code>token</code> and <code>oauthToken</code> are mutually exclusive, and{' '}
								<code>token</code> without <code>url</code> is rejected.
							</p>
							<table>
								<thead>
									<tr>
										<th scope="col">url</th>
										<th scope="col">token</th>
										<th scope="col">oauthToken</th>
										<th scope="col">What cs writes</th>
									</tr>
								</thead>
								<tbody>
									{AUTH_MODES.map((mode) => {
										return (
											<tr key={mode.csWrites}>
												<td>{mode.url}</td>
												<td>{mode.token}</td>
												<td>{mode.oauth}</td>
												<td>
													<RichText text={mode.csWrites} />
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
					...meta('the-exit-codes'),
					body: (
						<>
							<p>Two codes, and no others.</p>
							<table>
								<thead>
									<tr>
										<th scope="col">Code</th>
										<th scope="col">What it means</th>
									</tr>
								</thead>
								<tbody>
									{EXIT_CODES.map((exit) => {
										return (
											<tr key={exit.code}>
												<td>
													<code>{exit.code}</code>
												</td>
												<td>
													<RichText text={exit.meaning} />
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
					...meta('the-files'),
					body: (
						<>
							<p>The four things cs keeps on the machine, all under your home directory.</p>
							<table>
								<thead>
									<tr>
										<th scope="col">What</th>
										<th scope="col">Where</th>
										<th scope="col">Notes</th>
									</tr>
								</thead>
								<tbody>
									{ARTIFACTS.map((artifact) => {
										return (
											<tr key={artifact.value}>
												<td>{artifact.label}</td>
												<td>
													<code>{artifact.value}</code>
												</td>
												<td>
													<RichText text={artifact.what} />
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</>
					)
				}
			]}
		/>
	);
};

export default Reference;
