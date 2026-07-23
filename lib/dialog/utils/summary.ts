/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { t } from './l10n.ts'

/**
 * Plain-language summary of a share's expiration/password outcome, inspired by
 * the file request dialog. Returns null when neither applies.
 *
 * @param expiration The expiration date, or null if the share does not expire
 * @param passwordProtected Whether the share is password protected
 */
export function shareOutcomeSummary(expiration: Date | null, passwordProtected: boolean): string | null {
	if (expiration) {
		const placeholders = {
			date: expiration.toLocaleDateString(),
			time: expiration.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
		}
		return passwordProtected
			? t('This share will expire on {date} at {time} and will be password protected.', placeholders)
			: t('This share will expire on {date} at {time}.', placeholders)
	}
	if (passwordProtected) {
		return t('This share will be password protected.')
	}
	return null
}
