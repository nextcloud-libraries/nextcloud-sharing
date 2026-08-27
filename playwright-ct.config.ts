/*!
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: CC0-1.0
 */

import { defineConfig, devices } from '@playwright/experimental-ct-vue'

export default defineConfig({
	testDir: './tests/ct',
	// Component tests are named *.ct.ts so Vitest (which globs *.spec/*.test)
	// ignores them and only Playwright picks them up.
	testMatch: '**/*.ct.ts',
	snapshotDir: './tests/ct/__snapshots__',
	fullyParallel: true,
	use: {
		trace: 'on-first-retry',
		ctViteConfig: {
			// __TRANSLATIONS__ is replaced by vite at build time; provide an empty
			// list so utils/l10n.ts can load in the test bundle.
			define: {
				__TRANSLATIONS__: '[]',
			},
		},
	},
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] },
		},
	],
})
