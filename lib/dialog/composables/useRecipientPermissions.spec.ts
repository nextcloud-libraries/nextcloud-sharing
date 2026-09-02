/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import type { Share } from '../api/share.ts'
import type { SharingOwner, SharingPermission, SharingRecipient } from '../types/api.ts'

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

vi.mock('../utils/l10n.ts', () => ({
	t: (text: string, params: Record<string, string> = {}) => text.replace(/\{(\w+)\}/g, (_, k) => params[k] ?? `{${k}}`),
}))

function permission(cls: string, enabled: boolean, presets: string[]): SharingPermission {
	return { class: cls, source_class: null, display_name: cls, hint: null, priority: 0, presets, enabled }
}

const alice: SharingOwner = { user_id: 'alice', instance: null, display_name: 'Alice', icon: { svg: '' } }
const bob: SharingOwner = { user_id: 'bob', instance: null, display_name: 'Bob', icon: { svg: '' } }

function recipient(overrides: Partial<SharingRecipient> = {}): SharingRecipient {
	return {
		class: 'UserRecipient',
		value: 'carol',
		instance: null,
		display_name: 'Carol',
		icon: null,
		secret: { updatable: false },
		initiator: null,
		permissions: [],
		...overrides,
	}
}

function fakeShare(permissions: SharingPermission[], preset: string | null = null, owner: SharingOwner = alice) {
	return {
		permissions,
		permissionPreset: preset,
		data: { owner },
		setRecipientPermission: vi.fn().mockResolvedValue(undefined),
	} as unknown as Share
}

// Share grants read (in View + Edit) but not write (Edit-only) → max = { read }.
function cappedShare(preset: string | null = 'View', owner: SharingOwner = alice) {
	return fakeShare([permission('read', true, ['View', 'Edit']), permission('write', false, ['Edit'])], preset, owner)
}

describe('presetOptions', () => {
	test('offers only presets within the share max', () => {
		const { presetOptions } = useRecipientPermissions(cappedShare(), () => recipient())
		expect(presetOptions.value.map((o) => o.value)).toEqual(['View', CUSTOM_VALUE])
	})
})

describe('permissions', () => {
	test('flags availability against the share max', () => {
		const r = recipient({ permissions: [permission('read', true, ['View']), permission('write', false, ['Edit'])] })
		const { permissions } = useRecipientPermissions(cappedShare(), () => r)
		expect(permissions.value.find((p) => p.class === 'read')!.available).toBe(true)
		expect(permissions.value.find((p) => p.class === 'write')!.available).toBe(false)
	})
})

describe('selectedPreset', () => {
	test('derives the preset from the enabled permissions', () => {
		const r = recipient({ permissions: [permission('read', true, ['View', 'Edit'])] })
		expect(useRecipientPermissions(cappedShare(), () => r).selectedPreset.value.value).toBe('View')
	})

	test('falls back to custom when no preset matches the enabled permissions', () => {
		const r = recipient({ permissions: [permission('read', false, ['View', 'Edit'])] })
		expect(useRecipientPermissions(cappedShare(), () => r).selectedPreset.value.value).toBe(CUSTOM_VALUE)
	})
})

describe('notice', () => {
	test('null when nothing is capped', () => {
		const share = fakeShare([permission('read', true, ['View'])])
		const r = recipient({ permissions: [permission('read', true, ['View'])] })
		expect(useRecipientPermissions(share, () => r).notice.value).toBeNull()
	})

	test('reshare wording when the recipient initiator differs from the owner', () => {
		const r = recipient({ initiator: bob, permissions: [permission('write', false, ['Edit'])] })
		const { notice } = useRecipientPermissions(cappedShare('View'), () => r)
		expect(notice.value).toBe('Alice shared this with you as "Can view". You can only grant the same or fewer permissions.')
	})

	test('default wording when not a reshare', () => {
		const r = recipient({ initiator: alice, permissions: [permission('write', false, ['Edit'])] })
		const { notice } = useRecipientPermissions(cappedShare('View'), () => r)
		expect(notice.value).toBe('This share is limited to "Can view". You can only grant the same or fewer permissions.')
	})
})

describe('mutations', () => {
	let share: Share

	beforeEach(() => {
		share = cappedShare()
	})

	test('onPresetChange applies the preset by toggling permissions', async () => {
		const r = recipient({ permissions: [permission('read', false, ['View', 'Edit']), permission('write', false, ['Edit'])] })
		const { onPresetChange } = useRecipientPermissions(share, () => r)

		await onPresetChange({ value: CUSTOM_VALUE, label: 'Can…' })
		expect(share.setRecipientPermission).not.toHaveBeenCalled()

		await onPresetChange({ value: 'View', label: 'Can view' })
		// read belongs to the preset and is within the share max; write is over it.
		expect(share.setRecipientPermission).toHaveBeenCalledWith('UserRecipient', 'carol', 'read', true, undefined)
		expect(share.setRecipientPermission).toHaveBeenCalledTimes(1)
	})

	test('onPermissionToggle forwards to the share', async () => {
		const { onPermissionToggle } = useRecipientPermissions(share, () => recipient())
		await onPermissionToggle(permission('read', false, ['View']), true)
		expect(share.setRecipientPermission).toHaveBeenCalledWith('UserRecipient', 'carol', 'read', true, undefined)
	})
})

describe('share permissions as the base', () => {
	test('a recipient without overrides inherits the share permissions', () => {
		const { permissions } = useRecipientPermissions(cappedShare(), () => recipient())
		expect(permissions.value.find((p) => p.class === 'read')!.enabled).toBe(true)
		expect(permissions.value.find((p) => p.class === 'write')!.enabled).toBe(false)
	})

	test('recipient overrides are applied on top of the share', () => {
		const r = recipient({ permissions: [permission('read', false, ['View', 'Edit'])] })
		const { permissions } = useRecipientPermissions(cappedShare(), () => r)
		expect(permissions.value.find((p) => p.class === 'read')!.enabled).toBe(false)
	})

	test('applies a preset to a recipient that has no overrides yet', async () => {
		// Share grants both, so the recipient inherits both; "View" must turn write off.
		const share = fakeShare([permission('read', true, ['View', 'Edit']), permission('write', true, ['Edit'])])
		const { onPresetChange } = useRecipientPermissions(share, () => recipient())
		await onPresetChange({ value: 'View', label: 'Can view' })
		expect(share.setRecipientPermission).toHaveBeenCalledWith('UserRecipient', 'carol', 'write', false, undefined)
	})
})
