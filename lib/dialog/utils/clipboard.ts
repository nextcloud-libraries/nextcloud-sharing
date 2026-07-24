/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { t } from './l10n.ts'

/**
 * Copy text to the clipboard. In insecure (http) contexts where
 * navigator.clipboard is unavailable, fall back to a manual-copy prompt
 * (document.execCommand('copy') is deprecated and unreliable).
 *
 * @param text The text to copy
 */
export async function copyToClipboard(text: string): Promise<void> {
	if (navigator.clipboard?.writeText) {
		await navigator.clipboard.writeText(text)
		return
	}
	window.prompt(t('Please copy the share link manually'), text)
}
