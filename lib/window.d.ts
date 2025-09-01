/*!
 * SPDX-FileCopyrightText: 2025 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import type { ISidebarAction, ISidebarInlineAction, ISidebarSection } from './ui/index.ts'

declare global {
	interface Window {
		_nc_files_sharing_sidebar_actions?: Map<string, ISidebarAction>
		_nc_files_sharing_sidebar_inline_actions?: Map<string, ISidebarInlineAction>
		_nc_files_sharing_sidebar_sections?: Map<string, ISidebarSection>
	}
}
