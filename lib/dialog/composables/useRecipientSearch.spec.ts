/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import type { Share } from '../api/share.ts'
import type { SharingRecipient } from '../types/api.ts'

import { beforeEach, describe, expect, test, vi } from 'vitest'
import { useRecipientSearch } from './useRecipientSearch.ts'

const searchRecipients = vi.hoisted(() => vi.fn())
vi.mock('../api/share.ts', () => ({ searchRecipients }))
vi.mock('debounce', () => ({ default: (fn: unknown) => fn }))

const bob: SharingRecipient = {
	class: 'UserRecipient',
	value: 'bob',
	instance: null,
	display_name: 'Bob',
	icon: null,
	secret: { updatable: false },
	initiator: null,
	permissions: [],
}

/**
 * Build a fake Share whose recipient list grows as recipients are added.
 */
function fakeShare() {
	const recipients: { class: string, value: string }[] = []
	return {
		recipients,
		addRecipient: vi.fn(async (cls: string, value: string) => {
			recipients.push({ class: cls, value })
		}),
	} as unknown as Share
}

beforeEach(() => {
	vi.clearAllMocks()
	searchRecipients.mockResolvedValue([bob])
})

describe('useRecipientSearch (add-only)', () => {
	test('search populates results and the class map', async () => {
		const { results, onSearch } = useRecipientSearch(fakeShare())
		await onSearch('bo')
		expect(results.value).toHaveLength(1)
		expect(results.value[0].id).toBe('bob')
	})

	test('selecting adds the recipient once and clears the field', async () => {
		const share = fakeShare()
		const { results, selected, onSearch, onSelect } = useRecipientSearch(share)
		await onSearch('bo')

		await onSelect(results.value)
		expect(share.addRecipient).toHaveBeenCalledWith('UserRecipient', 'bob')
		expect(selected.value).toEqual([])

		// Already a recipient → not added again.
		await onSelect(results.value)
		expect(share.addRecipient).toHaveBeenCalledTimes(1)
	})

	test('accepts a single model or an array', async () => {
		const share = fakeShare()
		const { results, onSearch, onSelect } = useRecipientSearch(share)
		await onSearch('bo')
		await onSelect(results.value[0])
		expect(share.addRecipient).toHaveBeenCalledWith('UserRecipient', 'bob')
	})
})
