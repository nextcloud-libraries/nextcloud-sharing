/*!
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import type { UserConfigFn } from 'vite'

import { createLibConfig } from '@nextcloud/vite-config'
import { defineConfig } from 'vite'

export default defineConfig((env) => {
	return createLibConfig({
		index: 'lib/index.ts',
		public: 'lib/public.ts',
		ui: 'lib/ui/index.ts',
	}, {
		libraryFormats: ['es'],
		nodeExternalsOptions: {
			// for subpath imports like '@nextcloud/l10n/gettext'
			include: [/^@nextcloud\//],
		},
		DTSPluginOptions: {
			rollupTypes: env.mode === 'production',
		},
	})(env)
}) as UserConfigFn
