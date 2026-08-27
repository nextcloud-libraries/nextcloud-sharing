/*!
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import type { UserConfigFn } from 'vite'

import { createLibConfig } from '@nextcloud/vite-config'
import { po as poParser } from 'gettext-parser'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { defineConfig } from 'vite'

const translations = !existsSync('./l10n')
	? []
	: readdirSync('./l10n')
			.filter((name) => name !== 'messages.pot' && name.endsWith('.pot'))
			.map((file) => {
				const path = './l10n/' + file
				const locale = file.slice(0, -'.pot'.length)

				const po = readFileSync(path)
				const json = poParser.parse(po)
				return {
					locale,
					json,
				}
			})

export default defineConfig((env) => {
	return createLibConfig({
		index: 'lib/index.ts',
		public: 'lib/public.ts',
		ui: 'lib/ui/index.ts',
		dialog: 'lib/dialog/index.ts',
	}, {
		libraryFormats: ['es'],
		nodeExternalsOptions: {
			// for subpath imports like '@nextcloud/l10n/gettext'
			include: [/^@nextcloud\//],
			// bundle raw svg icons into the library
			exclude: [/^@mdi\/svg\//],
		},
		// Multi-entry: CSS is emitted per entry and imported from the module,
		// which any bundler resolves (same distribution style as @nextcloud/vue).
		inlineCSS: true,
		replace: {
			__TRANSLATIONS__: JSON.stringify(translations),
		},
	})(env)
}) as UserConfigFn
