/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import type { Ref } from 'vue'
import type { Share } from '../api/share.ts'

import { computed, ref, watch } from 'vue'
import { RECIPIENT_TYPE_TOKEN } from '../constants.ts'
import { getOcsErrorMessage } from '../utils/api.ts'
import { copyToClipboard } from '../utils/clipboard.ts'
import { generateShareToken, resolveShareLink } from '../utils/link.ts'
import { logger } from '../utils/logger.ts'

/**
 * Manage the public-link aspects of a share: keeping the token recipient in sync
 * with the link/no-link state, resolving the link, and copying it.
 *
 * @param share The share being edited
 * @param isLinkShare Whether the "Anyone with the link" view is active
 */
export function useLinkShare(share: Share, isLinkShare: Ref<boolean>) {
	// A link share is just a share with a token recipient.
	const tokenRecipient = computed(() => share.recipients.find((r) => r.class === RECIPIENT_TYPE_TOKEN) ?? null)

	const linkRecipientLoading = ref(false)
	const linkRecipientError = ref<string | null>(null)
	const copied = ref(false)

	const resolvedLink = computed<string | null>(() => resolveShareLink(share, isLinkShare.value))

	// Link actions are unusable while the recipient sync runs, or on the link view
	// before its token recipient exists (e.g. it failed to be created).
	const linkActionsDisabled = computed(() => linkRecipientLoading.value || (isLinkShare.value && !tokenRecipient.value))

	/**
	 * Add the token recipient on the link view (so the backend returns the link
	 * properties), remove it otherwise so its link-only properties don't leak into
	 * the invited-people view.
	 */
	async function syncTokenRecipient() {
		const needsToken = isLinkShare.value
		if (needsToken === !!tokenRecipient.value) {
			return
		}

		linkRecipientError.value = null
		linkRecipientLoading.value = true
		try {
			if (needsToken) {
				await share.addRecipient(RECIPIENT_TYPE_TOKEN, generateShareToken())
			} else {
				const { class: recipientClass, value, instance } = tokenRecipient.value!
				await share.removeRecipient(recipientClass, value, instance ?? undefined)
			}
		} catch (e) {
			logger.error('Failed to sync link share recipient', { error: e })
			linkRecipientError.value = getOcsErrorMessage(e)
		} finally {
			linkRecipientLoading.value = false
		}
	}

	watch(isLinkShare, syncTokenRecipient, { immediate: true })

	/**
	 * Copy the current share link, activating the draft first if needed so a
	 * public link (and its token) exists.
	 */
	async function copyLink() {
		try {
			if (isLinkShare.value && share.state === 'draft') {
				await share.activate()
			}
			const url = resolvedLink.value
			if (!url) {
				logger.warn('No link available to copy', { isLinkShare: isLinkShare.value })
				return
			}
			await copyToClipboard(url)
			copied.value = true
			setTimeout(() => {
				copied.value = false
			}, 2000)
		} catch (e) {
			logger.error('Failed to copy link to clipboard', { error: e })
		}
	}

	return {
		tokenRecipient,
		linkRecipientLoading,
		linkRecipientError,
		linkActionsDisabled,
		resolvedLink,
		copied,
		retryTokenRecipient: syncTokenRecipient,
		copyLink,
	}
}
