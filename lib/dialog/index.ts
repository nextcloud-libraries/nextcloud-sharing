/*!
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

/**
 * @module dialog
 *
 * Experimental sharing dialog for the unified sharing API (Nextcloud >= 35).
 * The API of this module may change in any minor release.
 */

import type { INode } from '@nextcloud/files'
import type { SharingCapabilities } from './types/api.ts'

import { getCapabilities } from '@nextcloud/capabilities'
import { showError } from '@nextcloud/dialogs'
import { spawnDialog } from '@nextcloud/vue/functions/dialog'
import SharingDialog from './SharingDialog.vue'
import { t } from './utils/l10n.ts'

export type * from './types/api.ts'
export type { Share } from './api/share.ts'
export { createShare, getShare, searchRecipients } from './api/share.ts'
export { SharingDialog }

/**
 * Whether the server provides the unified sharing API this dialog talks to.
 */
export function isSharingDialogAvailable(): boolean {
	const capabilities = getCapabilities() as Partial<SharingCapabilities>
	return (capabilities.sharing?.api_versions?.length ?? 0) > 0
}

/**
 * Open the sharing dialog for a given node.
 * Resolves once the dialog is closed.
 *
 * Safe to call unconditionally: if the server does not provide the unified
 * sharing API, an error toast is shown and the promise resolves to `undefined`.
 * Use {@link isSharingDialogAvailable} beforehand to hide the entry point entirely.
 *
 * @param node The file or folder to share
 */
export async function openSharingDialog(node: INode): Promise<unknown> {
	if (!isSharingDialogAvailable()) {
		showError(t('Sharing is not available on this server'))
		return
	}

	return await spawnDialog(SharingDialog, { node })
}
