/*!
 * SPDX-FileCopyrightText: 2025 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: CC0-1.0
 */

import vue from '@vitejs/plugin-vue'
import { configDefaults, defineConfig } from 'vitest/config'

export default defineConfig({
	plugins: [vue()],
	define: {
		// Translations are injected by vite at build time, none needed in tests
		__TRANSLATIONS__: '[]',
	},
	test: {
		environment: 'happy-dom',
		// Playwright component tests live under tests/ct/ and must not be run by Vitest.
		exclude: [...configDefaults.exclude, 'tests/ct/**'],
		// @nextcloud/vue ships ESM + CSS that must be transformed by Vite in tests.
		server: {
			deps: {
				// @nextcloud/dialogs pulls @nextcloud/vue components (and their CSS),
				// both must be transformed by Vite in tests.
				inline: [/@nextcloud\/vue/, /@nextcloud\/dialogs/],
			},
		},
		coverage: {
			provider: 'v8',
			all: true,
		},
	},
})
