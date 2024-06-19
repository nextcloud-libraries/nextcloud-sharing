/**
 * SPDX-FileCopyrightText: 2024 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 * @vitest-environment happy-dom
 */

import { beforeEach, describe, expect, test, vi } from 'vitest'

const initialState = vi.hoisted(() => ({ loadState: vi.fn() }))
vi.mock('@nextcloud/initial-state', () => initialState)

const mockPublicShare = () => {
	initialState.loadState.mockImplementation((app, key) => {
		if (key === 'isPublic') {
			return true
		} else if (key === 'sharingToken') {
			return 'modern-token'
		}
		throw new Error('Unexpected loadState')
	})
}

const mockLegacyPublicShare = () => {
	initialState.loadState.mockImplementationOnce(() => null)

	const input = document.createElement('input')
	input.id = 'isPublic'
	input.name = 'isPublic'
	input.type = 'hidden'
	input.value = '1'
	document.body.appendChild(input)

	const token = document.createElement('input')
	token.id = 'sharingToken'
	token.type = 'hidden'
	token.value = 'legacy-token'
	document.body.appendChild(token)
}

describe('isPublicShare', () => {
	beforeEach(() => {
		vi.resetModules()
		vi.resetAllMocks()
		// reset JSDom
		document.body.innerHTML = ''
	})

	const isPublicShare = async () => {
		const { isPublicShare: publicShare } = await import('./publicShare')
		return publicShare()
	}

	test('no public share', async () => {
		initialState.loadState.mockImplementation(() => null)

		expect(await isPublicShare()).toBe(false)
		expect(initialState.loadState).toBeCalledWith(
			'files_sharing',
			'isPublic',
			null,
		)
	})

	test('public share', async () => {
		mockPublicShare()

		expect(await isPublicShare()).toBe(true)
		expect(initialState.loadState).toBeCalledWith(
			'files_sharing',
			'isPublic',
			null,
		)
	})

	test('legacy public share', async () => {
		mockLegacyPublicShare()

		expect(await isPublicShare()).toBe(true)
	})
})

describe('getSharingToken', () => {
	beforeEach(() => {
		vi.resetModules()
		vi.resetAllMocks()
		// reset happy-dom
		document.body.innerHTML = ''
	})

	const getSharingToken = async () => {
		const { getSharingToken: sharingToken } = await import('./publicShare')
		return sharingToken()
	}

	test('no public share', async () => {
		initialState.loadState.mockImplementation(() => null)

		expect(await getSharingToken()).toBe(null)
		expect(initialState.loadState).toBeCalledWith(
			'files_sharing',
			'sharingToken',
			null,
		)
	})

	test('public share', async () => {
		mockPublicShare()

		expect(await getSharingToken()).toBe('modern-token')
		expect(initialState.loadState).toBeCalledWith(
			'files_sharing',
			'sharingToken',
			null,
		)
	})

	test('legacy public share', async () => {
		mockLegacyPublicShare()

		expect(await getSharingToken()).toBe('legacy-token')
	})
})
