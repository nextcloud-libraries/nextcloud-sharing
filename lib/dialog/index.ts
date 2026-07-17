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
import { spawnDialog } from '@nextcloud/vue/functions/dialog'
import SharingDialog from './SharingDialog.vue'

export type * from './types/api.ts'
export * from './api/sharing.ts'
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
 * @param node The file or folder to share
 * @throws If the server does not provide the unified sharing API
 */
export async function openSharingDialog(node: INode): Promise<unknown> {
	if (!isSharingDialogAvailable()) {
		throw new Error('The unified sharing API is not available on this server')
	}

	return await spawnDialog(SharingDialog, { node })
}
