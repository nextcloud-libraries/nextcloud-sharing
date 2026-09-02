/*!
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: CC0-1.0
 */

import { defineConfig, devices } from '@playwright/experimental-ct-vue'

export default defineConfig({
	// Component tests live under tests/ct/ (excluded from Vitest in
	// vitest.config), so Playwright owns this directory.
	testDir: './tests/ct',
	testMatch: '**/*.spec.ts',
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
