/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import type { Share } from '../api/share.ts'
import type { SharingRecipient } from '../types/api.ts'

import { describe, expect, test, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import { RECIPIENT_TYPE_TOKEN } from '../constants.ts'
import { useLinkShare } from './useLinkShare.ts'

vi.mock('../utils/link.ts', () => ({
	generateShareToken: () => 'token',
	resolveShareLink: () => null,
}))

function tokenRecipient(): SharingRecipient {
	return {
		class: RECIPIENT_TYPE_TOKEN,
		value: 'token',
		instance: null,
		display_name: 'Link',
		icon: null,
		secret: { updatable: false },
		initiator: null,
		permissions: [],
	}
}

function fakeShare(recipients: SharingRecipient[]) {
	return {
		recipients,
		state: 'active',
		addRecipient: vi.fn().mockResolvedValue(undefined),
		removeRecipient: vi.fn().mockResolvedValue(undefined),
	} as unknown as Share
}

describe('syncTokenRecipient', () => {
	test('keeps the token of an existing link share opened on the invited view', async () => {
		const share = fakeShare([tokenRecipient()])
		useLinkShare(share, ref(false))
		await nextTick()
		expect(share.removeRecipient).not.toHaveBeenCalled()
	})

	test('keeps the token of an existing link share opened on the link view', async () => {
		const share = fakeShare([tokenRecipient()])
		useLinkShare(share, ref(true))
		await nextTick()
		expect(share.removeRecipient).not.toHaveBeenCalled()
	})

	test('does not touch the share on mount when the view already matches', async () => {
		const share = fakeShare([])
		useLinkShare(share, ref(false))
		await nextTick()
		expect(share.addRecipient).not.toHaveBeenCalled()
		expect(share.removeRecipient).not.toHaveBeenCalled()
	})

	test('adds a token when switching to the link view', async () => {
		const share = fakeShare([])
		const isLinkShare = ref(false)
		useLinkShare(share, isLinkShare)
		isLinkShare.value = true
		await nextTick()
		expect(share.addRecipient).toHaveBeenCalledWith(RECIPIENT_TYPE_TOKEN, 'token')
	})

	test('removes the token when leaving the link view', async () => {
		const share = fakeShare([tokenRecipient()])
		const isLinkShare = ref(true)
		useLinkShare(share, isLinkShare)
		isLinkShare.value = false
		await nextTick()
		expect(share.removeRecipient).toHaveBeenCalledWith(RECIPIENT_TYPE_TOKEN, 'token', undefined)
	})
})
