/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import type { NcSelectUsersModel } from '@nextcloud/vue/components/NcSelectUsers'
import type { Share } from '../api/share.ts'

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

	// Map result user IDs back to their SharingRecipient class for API calls.
	const recipientClassMap = new Map<string, string>()

	/**
	 * Add the picked recipients to the share, then clear the field.
	 *
	 * @param value The current selection from NcSelectUsers (single or array)
	 */
	async function onSelect(value: NcSelectUsersModel | NcSelectUsersModel[]) {
		const models = Array.isArray(value) ? value : [value]
		for (const model of models) {
			const recipientClass = recipientClassMap.get(model.id)
			if (!recipientClass || share.recipients.some((recipient) => recipient.value === model.id)) {
				continue
			}
			try {
				await share.addRecipient(recipientClass, model.id)
			} catch (e) {
				logger.error('Failed to add recipient', { error: e, recipient: model })
			}
		}
		selected.value = []
	}

	/**
	 * Search for recipients and cache the results, tracking each result's
	 * recipient class so it can be added on selection.
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
				recipientClassMap.set(r.value, r.class)
			}
			results.value = recipients.map(recipientToNcSelectUsersModel)
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
