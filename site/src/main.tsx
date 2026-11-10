import { ThemeProvider } from '@jjuidev/react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';

import { createRouter } from '@/components/AppRouter/AppRouter';
import { CS_SKIN } from '@/styles/skins/cs.skin';

import './styles/styles.css';

const container = document.getElementById('root');

if (!container) {
	throw new Error('index.html is missing the #root element');
}

createRoot(container).render(
	<StrictMode>
		<ThemeProvider skins={[CS_SKIN]}>
			<RouterProvider router={createRouter()} />
		</ThemeProvider>
	</StrictMode>
);
