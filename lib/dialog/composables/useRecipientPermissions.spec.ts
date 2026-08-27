/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import type { Share } from '../api/share.ts'
import type { SharingPermission, SharingRecipient } from '../types/api.ts'

import { beforeEach, describe, expect, test, vi } from 'vitest'
import { CUSTOM_VALUE, useRecipientPermissions } from './useRecipientPermissions.ts'

vi.mock('@nextcloud/capabilities', () => ({
	getCapabilities: () => ({
		sharing: {
			permission_presets: [
				{ class: 'View', display_name: 'Can view', hint: null },
				{ class: 'Edit', display_name: 'Can edit', hint: null },
			],
		},
	}),
}))

vi.mock('../utils/l10n.ts', () => ({ t: (s: string) => s }))

function permission(cls: string, enabled: boolean, presets: string[]): SharingPermission {
	return {
		class: cls,
		source_class: null,
		display_name: cls,
		hint: null,
		priority: 0,
		presets,
		enabled,
	}
}

function recipient(overrides: Partial<SharingRecipient> = {}): SharingRecipient {
	return {
		class: 'UserRecipient',
		value: 'bob',
		instance: null,
		display_name: 'Bob',
		icon: null,
		secret: { updatable: false },
		initiator: null,
		permission_preset: null,
		permissions: [],
		...overrides,
	}
}

/**
 * Build a fake Share exposing just what the composable reads/calls.
 *
 * @param permissions The share-level (maximum) permissions
 */
function fakeShare(permissions: SharingPermission[]) {
	return {
		permissions,
		recipients: [],
		selectRecipientPreset: vi.fn().mockResolvedValue(undefined),
		setRecipientPermission: vi.fn().mockResolvedValue(undefined),
	} as unknown as Share
}

// Share grants read (in View + Edit) but not write (Edit-only) → max = { read }.
function share() {
	return fakeShare([
		permission('read', true, ['View', 'Edit']),
		permission('write', false, ['Edit']),
	])
}

describe('recipientPresetOptions', () => {
	test('offers only presets whose member permissions are all within the share max', () => {
		const { recipientPresetOptions } = useRecipientPermissions(share())
		expect(recipientPresetOptions().map((o) => o.value)).toEqual(['View', CUSTOM_VALUE])
	})
})

describe('recipientPermissions', () => {
	test('flags each toggle available only when granted at share level', () => {
		const { recipientPermissions } = useRecipientPermissions(share())
		const r = recipient({ permissions: [permission('read', true, ['View']), permission('write', false, ['Edit'])] })
		const perms = recipientPermissions(r)
		expect(perms.find((p) => p.class === 'read')!.available).toBe(true)
		expect(perms.find((p) => p.class === 'write')!.available).toBe(false)
	})
})

describe('recipientSelectedPreset', () => {
	test('falls back to custom when the recipient preset is not offered', () => {
		const { recipientSelectedPreset } = useRecipientPermissions(share())
		expect(recipientSelectedPreset(recipient({ permission_preset: 'Edit' })).value).toBe(CUSTOM_VALUE)
		expect(recipientSelectedPreset(recipient({ permission_preset: 'View' })).value).toBe('View')
	})
})

describe('mutations', () => {
	let s: Share

	beforeEach(() => {
		s = share()
	})

	test('onRecipientPresetChange forwards to the share, skipping custom', async () => {
		const { onRecipientPresetChange } = useRecipientPermissions(s)
		const r = recipient()
		await onRecipientPresetChange(r, { value: CUSTOM_VALUE, label: 'Can…' })
		expect(s.selectRecipientPreset).not.toHaveBeenCalled()
		await onRecipientPresetChange(r, { value: 'View', label: 'Can view' })
		expect(s.selectRecipientPreset).toHaveBeenCalledWith('UserRecipient', 'bob', 'View', undefined)
	})

	test('onRecipientPermissionToggle forwards to the share', async () => {
		const { onRecipientPermissionToggle } = useRecipientPermissions(s)
		await onRecipientPermissionToggle(recipient(), permission('read', false, ['View']), true)
		expect(s.setRecipientPermission).toHaveBeenCalledWith('UserRecipient', 'bob', 'read', true, undefined)
	})
})
