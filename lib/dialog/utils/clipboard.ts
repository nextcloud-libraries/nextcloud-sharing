/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

/**
 * Copy text to the clipboard.
 *
 * Uses the async Clipboard API when available (requires a secure context).
 * Plain http (a non-secure context) does not expose it, so we fall back to a
 * hidden textarea + `document.execCommand('copy')` — deprecated but the only
 * mechanism that actually copies there. Throws if neither path succeeds so
 * callers do not report a successful copy that did not happen.
 *
 * @param text The text to copy
 */
export async function copyToClipboard(text: string): Promise<void> {
	if (window.isSecureContext && navigator.clipboard?.writeText) {
		await navigator.clipboard.writeText(text)
		return
	}

	// Legacy fallback for non-secure contexts.
	const textarea = document.createElement('textarea')
	textarea.value = text
	textarea.setAttribute('readonly', '')
	textarea.style.position = 'fixed'
	textarea.style.top = '0'
	textarea.style.opacity = '0'
	document.body.appendChild(textarea)
	textarea.select()
	textarea.setSelectionRange(0, text.length)
	try {
		if (!document.execCommand('copy')) {
			throw new Error('Copy command was rejected')
		}
	} finally {
		document.body.removeChild(textarea)
	}
}
