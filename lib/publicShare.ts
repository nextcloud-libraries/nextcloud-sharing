/*!
 * SPDX-FileCopyrightText: 2024 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

/**
 * @module public
 */

import { loadState } from '@nextcloud/initial-state'

/**
 * Check if the current page is on a public share
 */
export function isPublicShare(): boolean {
	// check both the new initial state version and fallback to legacy input
	return (
		loadState<boolean | null>('files_sharing', 'isPublic', null)
		?? document.querySelector('input#isPublic[type="hidden"][name="isPublic"][value="1"]') !== null
	)
}

/**
 * Get the sharing token for the current public share
 */
export function getSharingToken(): string | null {
	return (
		loadState<string | null>('files_sharing', 'sharingToken', null)
		?? document.querySelector<HTMLInputElement>('input#sharingToken[type="hidden"]')?.value
		?? null
	)
}
