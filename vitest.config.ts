/*!
 * SPDX-FileCopyrightText: 2025 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: CC0-1.0
 */

import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

export default defineConfig({
	plugins: [vue()],
	define: {
		// Translations are injected by vite at build time, none needed in tests
		__TRANSLATIONS__: '[]',
	},
	test: {
		environment: 'happy-dom',
		// @nextcloud/vue ships ESM + CSS that must be transformed by Vite in tests.
		server: {
			deps: {
				inline: [/@nextcloud\/vue/],
			},
		},
		coverage: {
			provider: 'v8',
			all: true,
		},
	},
})
