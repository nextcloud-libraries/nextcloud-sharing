/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

/**
 * Hardcoded backend class strings used for UI decisions.
 * These must be validated against capabilities at runtime
 * to ensure they are registered on the server.
 */

// --- Source types ---

export const SOURCE_TYPE_NODE = 'OCA\\Files\\Sharing\\Source\\NodeShareSourceType'

// --- Property types ---

/** Share URL — hidden from property lists, used by copy link button */
export const PROPERTY_URL = 'OC\\Core\\Sharing\\Property\\UrlSharePropertyType'

/** Note to recipients — shown on first page, not in settings */
export const PROPERTY_NOTE = 'OC\\Core\\Sharing\\Property\\NoteSharePropertyType'

/** Expiration date — used to summarize the share's outcome */
export const PROPERTY_EXPIRATION = 'OC\\Core\\Sharing\\Property\\ExpirationDateSharePropertyType'

/** Password protection — used to summarize the share's outcome */
export const PROPERTY_PASSWORD = 'OC\\Core\\Sharing\\Property\\PasswordSharePropertyType'

/** Properties shown on the first page only */
export const FIRST_PAGE_PROPERTIES: string[] = [
	PROPERTY_NOTE,
]

/** Properties excluded from all property loops (accessed directly) */
export const HIDDEN_PROPERTIES: string[] = [
	PROPERTY_URL,
]

// --- Recipient types ---

/** User recipient — NcSelectUsers handles avatars natively for this type */
export const RECIPIENT_TYPE_USER = 'OC\\Core\\Sharing\\Recipient\\UserShareRecipientType'

/** Email (link-by-mail) recipient */
export const RECIPIENT_TYPE_EMAIL = 'OC\\Core\\Sharing\\Recipient\\EmailShareRecipientType'

/** Group recipient */
export const RECIPIENT_TYPE_GROUP = 'OC\\Core\\Sharing\\Recipient\\GroupShareRecipientType'

/** Team (circle) recipient */
export const RECIPIENT_TYPE_TEAM = 'OC\\Core\\Sharing\\Recipient\\TeamShareRecipientType'

/** Token (public link) recipient — its presence turns the share into a link share */
export const RECIPIENT_TYPE_TOKEN = 'OC\\Core\\Sharing\\Recipient\\TokenShareRecipientType'
