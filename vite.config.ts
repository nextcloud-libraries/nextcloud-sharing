/*!
 * SPDX-FileCopyrightText: 2024 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: CC0-1.0
 */

import type { UserConfig } from 'vite'

import { createLibConfig } from '@nextcloud/vite-config'
import { join } from 'node:path'

export default createLibConfig(
	{
		index: join(__dirname, 'lib', 'index.ts'),
		public: join(__dirname, 'lib', 'publicShare.ts'),
	},
	{
		DTSPluginOptions: {
			rollupTypes: true,
		},
		config: {
			test: {
				coverage: {
					provider: 'v8',
					all: true,
				},
			},
		} as UserConfig,
		libraryFormats: ['cjs', 'es'],
	},
)
