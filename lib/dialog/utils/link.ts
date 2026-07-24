/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import type { Share } from '../api/share.ts'

import { generateUrl } from '@nextcloud/router'
import { v4 as uuidv4 } from 'uuid'
import { RECIPIENT_TYPE_TOKEN, SOURCE_TYPE_NODE } from '../constants.ts'

/**
 * Generate a random token value. Link recipients require a value of 32-255
 * chars; a UUID (36 chars, URL-safe) fits and is cryptographically random.
 */
export function generateShareToken(): string {
	return uuidv4()
}

/**
 * Resolve the link to present for a share.
 *
 * For a public link the URL lives on the token recipient's secret (only once
 * the share is active). Otherwise it is the private link pointing straight at
 * the file by its node id. Returns null when no link can be derived.
 *
 * @param share The share
 * @param isPublic Whether to resolve the public link rather than the private one
 */
export function resolveShareLink(share: Share, isPublic: boolean): string | null {
	if (isPublic) {
		return share.recipients.find((r) => r.class === RECIPIENT_TYPE_TOKEN)?.secret.url ?? null
	}
	const fileid = share.sources.find((s) => s.class === SOURCE_TYPE_NODE)?.value
	return fileid ? window.location.origin + generateUrl('/f/{fileid}', { fileid }) : null
}
