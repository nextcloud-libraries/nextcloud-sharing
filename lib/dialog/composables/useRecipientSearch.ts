/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import type { NcSelectUsersModel } from '@nextcloud/vue/components/NcSelectUsers'
import type { Share } from '../api/share.ts'
import type { SharingRecipient } from '../types/api.ts'

import debounce from 'debounce'
import { ref } from 'vue'
import { searchRecipients } from '../api/share.ts'
import { recipientToNcSelectUsersModel } from '../utils/api.ts'
import { logger } from '../utils/logger.ts'

/**
 * Manage recipient search and adding recipients to a share. The search field is
 * add-only: picking a result adds the recipient to the share and clears the
 * field. The authoritative list of recipients lives on the share itself and is
 * rendered separately (with per-recipient permissions).
 *
 * @param share The share being edited
 */
export function useRecipientSearch(share: Share) {
	const results = ref<NcSelectUsersModel[]>([])
	// Always-empty model: the field is a picker, selected recipients render below.
	const selected = ref<NcSelectUsersModel[]>([])
	const searching = ref(false)

	// Map result IDs back to their SharingRecipient for API calls.
	const recipientMap = new Map<string, SharingRecipient>()

	/**
	 * Add the picked recipients to the share, then clear the field.
	 *
	 * @param value The current selection from NcSelectUsers (single or array)
	 */
	async function onSelect(value: NcSelectUsersModel | NcSelectUsersModel[]) {
		const models = Array.isArray(value) ? value : [value]
		for (const model of models) {
			const recipient = recipientMap.get(model.id)
			if (!recipient || share.recipients.some((existing) => recipientKey(existing) === model.id)) {
				continue
			}
			try {
				await share.addRecipient(recipient.class, recipient.value, recipient.instance ?? undefined)
			} catch (e) {
				logger.error('Failed to add recipient', { error: e, recipient: model })
			}
		}
		selected.value = []
	}

	/**
	 * Search for recipients and cache the results, tracking each result's
	 * recipient so it can be added on selection.
	 *
	 * @param query The search query entered by the user
	 */
	async function onSearch(query: string) {
		if (!query) {
			results.value = []
			return
		}

		searching.value = true
		try {
			const recipients = await searchRecipients(query)
			for (const r of recipients) {
				recipientMap.set(recipientKey(r), r)
			}
			results.value = recipients.map((r) => ({ ...recipientToNcSelectUsersModel(r), id: recipientKey(r) }))
		} catch (e) {
			logger.error('Failed to search recipients', { error: e })
			results.value = []
		} finally {
			searching.value = false
		}
	}

	return {
		results,
		selected,
		searching,
		onSelect,
		onSearch: debounce(onSearch, 150),
	}
}

/**
 * Unique key of a recipient, as the same value can exist for several classes and instances.
 *
 * @param recipient The recipient to build the key for
 */
function recipientKey(recipient: SharingRecipient): string {
	return `${recipient.class}:${recipient.value}@${recipient.instance ?? ''}`
}
