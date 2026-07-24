/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import type { NcSelectUsersModel } from '@nextcloud/vue/components/NcSelectUsers'
import type { Share } from '../api/share.ts'

import debounce from 'debounce'
import { ref, watch } from 'vue'
import { searchRecipients } from '../api/share.ts'
import { recipientToNcSelectUsersModel } from '../utils/api.ts'
import { logger } from '../utils/logger.ts'

/**
 * Manage recipient search and single-recipient selection for a share. Selecting
 * a recipient adds it to the share; clearing/replacing removes the previous one.
 *
 * @param share The share being edited
 */
export function useRecipientSearch(share: Share) {
	const results = ref<NcSelectUsersModel[]>([])
	const selectedRecipient = ref<NcSelectUsersModel | undefined>(undefined)
	const searching = ref(false)

	// Map selected user IDs back to their SharingRecipient class for API calls.
	const recipientClassMap = new Map<string, string>()

	watch(selectedRecipient, async (newVal, oldVal) => {
		if (oldVal) {
			const recipientClass = recipientClassMap.get(oldVal.id)
			if (recipientClass) {
				try {
					await share.removeRecipient(recipientClass, oldVal.id)
				} catch (e) {
					logger.error('Failed to remove recipient', { error: e, recipient: oldVal })
				}
			}
		}

		if (newVal) {
			const recipientClass = recipientClassMap.get(newVal.id)
			if (recipientClass) {
				try {
					await share.addRecipient(recipientClass, newVal.id)
				} catch (e) {
					logger.error('Failed to add recipient', { error: e, recipient: newVal })
				}
			}
		}
	})

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
		selectedRecipient,
		searching,
		onSearch: debounce(onSearch, 150),
	}
}
