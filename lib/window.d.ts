/*!
 * SPDX-FileCopyrightText: 2025 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import type { ISharingSection } from './ui/index.ts'
declare global {
	interface Window {
		_nc_files_sharing_sidebar_sections?: Map<string, ISharingSection>
	}
}
