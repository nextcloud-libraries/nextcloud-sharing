/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import type { Share } from '../api/share.ts'
import type { SharingRecipient } from '../types/api.ts'

import { shallowMount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import RecipientRow from './RecipientRow.vue'

vi.mock('@nextcloud/capabilities', () => ({
	getCapabilities: () => ({ sharing: { permission_presets: [] } }),
}))

function recipient(overrides: Partial<SharingRecipient> = {}): SharingRecipient {
	return {
		class: 'UserRecipient',
		value: 'bob',
		instance: null,
		display_name: 'Bob',
		icon: null,
		secret: { updatable: false },
		initiator: null,
		permissions: [],
		...overrides,
	}
}

function fakeShare() {
	return {
		permissions: [],
		permissionPreset: null,
		data: { owner: { user_id: 'alice', instance: null, display_name: 'Alice', icon: { svg: '' } } },
		removeRecipient: vi.fn().mockResolvedValue(undefined),
		setRecipientPermission: vi.fn().mockResolvedValue(undefined),
	} as unknown as Share
}

function mountRow(r: SharingRecipient = recipient()) {
	const share = fakeShare()
	const wrapper = shallowMount(RecipientRow, {
		props: { share, recipient: r },
		global: { renderStubDefaultSlot: true },
	})
	return { wrapper, share }
}

/** Click the "Remove participant" action, found by its label. */
async function clickRemove(wrapper: ReturnType<typeof mountRow>['wrapper']) {
	const action = wrapper.findAllComponents({ name: 'NcActionButton' })
		.find((button) => button.text().includes('Remove participant'))
	expect(action, 'the remove action is rendered').toBeDefined()
	action!.vm.$emit('click')
	await nextTick()
}

beforeEach(() => vi.clearAllMocks())

describe('remove', () => {
	it('removes exactly the recipient the row renders', async () => {
		const { wrapper, share } = mountRow()
		await clickRemove(wrapper)
		expect(share.removeRecipient).toHaveBeenCalledOnce()
		expect(share.removeRecipient).toHaveBeenCalledWith('UserRecipient', 'bob', undefined)
	})

	it('forwards the recipient instance so the right federated recipient is removed', async () => {
		const { wrapper, share } = mountRow(recipient({ value: 'carol', instance: 'cloud.example.org' }))
		await clickRemove(wrapper)
		expect(share.removeRecipient).toHaveBeenCalledWith('UserRecipient', 'carol', 'cloud.example.org')
	})

	it('survives a failing removal', async () => {
		const { wrapper, share } = mountRow()
		vi.mocked(share.removeRecipient).mockRejectedValueOnce(new Error('nope'))
		await expect(clickRemove(wrapper)).resolves.not.toThrow()
	})
})
