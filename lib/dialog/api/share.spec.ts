/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import type { INode } from '@nextcloud/files'
import type { SharingShare } from '../types/api.ts'
import type { Share } from './share.ts'

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SOURCE_TYPE_NODE } from '../constants.ts'
import { createShare, getShare, searchRecipients } from './share.ts'
import * as client from './sharing.ts'

vi.mock('./sharing.ts', () => ({
	createShare: vi.fn(),
	getShare: vi.fn(),
	addShareSource: vi.fn(),
	removeShareSource: vi.fn(),
	addShareRecipient: vi.fn(),
	removeShareRecipient: vi.fn(),
	updateShareRecipientSecret: vi.fn(),
	updateShareProperty: vi.fn(),
	updateSharePermission: vi.fn(),
	selectSharePermissionPreset: vi.fn(),
	updateShareState: vi.fn(),
	searchRecipients: vi.fn(),
	deleteShare: vi.fn(),
}))

const mocked = vi.mocked(client)

/**
 * Build a minimal share schema for testing.
 *
 * @param overrides Fields to override on the default schema
 */
function share(overrides: Partial<SharingShare> = {}): SharingShare {
	return {
		id: 'abc',
		owner: { user_id: 'alice', instance: null, display_name: 'Alice', icon: { svg: '' } },
		last_updated: 0,
		state: 'draft',
		sources: [],
		recipients: [],
		properties: [],
		permissions: [],
		permission_preset: null,
		...overrides,
	}
}

/**
 * Obtain a Share instance wrapping the given schema, via the public factory.
 *
 * @param data The schema the instance should wrap
 */
async function makeShare(data: SharingShare = share()): Promise<Share> {
	mocked.getShare.mockResolvedValueOnce(data)
	return getShare(data.id)
}

beforeEach(() => {
	vi.clearAllMocks()
})

describe('Share', () => {
	it('createShare() wraps the created draft', async () => {
		mocked.createShare.mockResolvedValue(share({ id: 'new' }))
		const instance = await createShare()
		expect(mocked.createShare).toHaveBeenCalledOnce()
		expect(instance.id).toBe('new')
		expect(instance.state).toBe('draft')
	})

	it('getShare() fetches an existing share', async () => {
		mocked.getShare.mockResolvedValue(share({ id: 'x' }))
		const instance = await getShare('x', 'secret', { password: 'p' })
		expect(mocked.getShare).toHaveBeenCalledWith('x', 'secret', { password: 'p' })
		expect(instance.id).toBe('x')
	})

	it('exposes the schema through getters', async () => {
		const data = share({
			state: 'active',
			permission_preset: 'preset-a',
			sources: [{ class: 'S', value: '1', display_name: 'file', icon: null }],
		})
		const instance = await makeShare(data)
		expect(instance.data).toBe(data)
		expect(instance.state).toBe('active')
		expect(instance.permissionPreset).toBe('preset-a')
		expect(instance.sources).toHaveLength(1)
	})

	it('mutations pass the id to the client and re-sync the data', async () => {
		const instance = await makeShare(share({ id: 'abc' }))
		const updated = share({ id: 'abc', state: 'active' })
		mocked.updateShareState.mockResolvedValue(updated)

		const result = await instance.setState('active')

		expect(mocked.updateShareState).toHaveBeenCalledWith('abc', 'active')
		expect(result).toBe(instance) // returns this for chaining
		expect(instance.data).toBe(updated) // internal data replaced
		expect(instance.state).toBe('active')
	})

	it('setProperty forwards the class and value', async () => {
		const instance = await makeShare()
		mocked.updateShareProperty.mockResolvedValue(share())
		await instance.setProperty('P', 'v')
		expect(mocked.updateShareProperty).toHaveBeenCalledWith('abc', 'P', 'v')
	})

	it('setPermission forwards the class and enabled flag', async () => {
		const instance = await makeShare()
		mocked.updateSharePermission.mockResolvedValue(share())
		await instance.setPermission('C', false)
		expect(mocked.updateSharePermission).toHaveBeenCalledWith('abc', 'C', false)
	})

	it('addSource forwards the class and value', async () => {
		const instance = await makeShare()
		mocked.addShareSource.mockResolvedValue(share())
		await instance.addSource('S', '1')
		expect(mocked.addShareSource).toHaveBeenCalledWith('abc', 'S', '1')
	})

	it('addNode maps the node to the node source type', async () => {
		const instance = await makeShare()
		mocked.addShareSource.mockResolvedValue(share())
		await instance.addNode({ fileid: 42 } as unknown as INode)
		expect(mocked.addShareSource).toHaveBeenCalledWith('abc', SOURCE_TYPE_NODE, '42')
	})

	it('removeSource forwards the class and value', async () => {
		const instance = await makeShare()
		mocked.removeShareSource.mockResolvedValue(share())
		await instance.removeSource('S', '1')
		expect(mocked.removeShareSource).toHaveBeenCalledWith('abc', 'S', '1')
	})

	it('addRecipient forwards class, value and instance', async () => {
		const instance = await makeShare()
		mocked.addShareRecipient.mockResolvedValue(share())
		await instance.addRecipient('R', 'bob', 'https://remote.example')
		expect(mocked.addShareRecipient).toHaveBeenCalledWith('abc', 'R', 'bob', 'https://remote.example')
	})

	it('removeRecipient forwards class, value and instance', async () => {
		const instance = await makeShare()
		mocked.removeShareRecipient.mockResolvedValue(share())
		await instance.removeRecipient('R', 'bob')
		expect(mocked.removeShareRecipient).toHaveBeenCalledWith('abc', 'R', 'bob', undefined)
	})

	it('setRecipientSecret forwards the secret', async () => {
		const instance = await makeShare()
		mocked.updateShareRecipientSecret.mockResolvedValue(share())
		await instance.setRecipientSecret('R', 'bob', 'sEcret')
		expect(mocked.updateShareRecipientSecret).toHaveBeenCalledWith('abc', 'R', 'bob', 'sEcret', undefined)
	})

	it('selectPreset forwards the preset class', async () => {
		const instance = await makeShare()
		mocked.selectSharePermissionPreset.mockResolvedValue(share())
		await instance.selectPreset('preset-a')
		expect(mocked.selectSharePermissionPreset).toHaveBeenCalledWith('abc', 'preset-a')
	})

	it('refresh re-fetches the share by id', async () => {
		const instance = await makeShare(share({ id: 'abc' }))
		const fresh = share({ id: 'abc', state: 'active' })
		mocked.getShare.mockResolvedValueOnce(fresh)
		await instance.refresh()
		expect(mocked.getShare).toHaveBeenLastCalledWith('abc')
		expect(instance.data).toBe(fresh)
	})

	it('activate() sets the state to active', async () => {
		const instance = await makeShare()
		mocked.updateShareState.mockResolvedValue(share({ state: 'active' }))
		await instance.activate()
		expect(mocked.updateShareState).toHaveBeenCalledWith('abc', 'active')
	})

	it('delete() removes the share and returns nothing', async () => {
		const instance = await makeShare()
		mocked.deleteShare.mockResolvedValue()
		await expect(instance.delete()).resolves.toBeUndefined()
		expect(mocked.deleteShare).toHaveBeenCalledWith('abc')
	})

	it('searchRecipients delegates to the client', async () => {
		mocked.searchRecipients.mockResolvedValue([])
		await searchRecipients('bob', 'UserType', 5, 2)
		expect(mocked.searchRecipients).toHaveBeenCalledWith('bob', 'UserType', 5, 2)
	})
})
