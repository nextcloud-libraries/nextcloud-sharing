/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import type { SharingRecipient } from '../types/api.ts'

import { describe, expect, it } from 'vitest'
import {
	RECIPIENT_TYPE_EMAIL,
	RECIPIENT_TYPE_GROUP,
	RECIPIENT_TYPE_TEAM,
	RECIPIENT_TYPE_USER,
} from '../constants.ts'
import { recipientToNcSelectUsersModel } from './api.ts'

/**
 * Build a minimal recipient of the given type for testing.
 *
 * @param overrides Partial recipient fields to override the defaults
 */
function makeRecipient(overrides: Partial<SharingRecipient> = {}): SharingRecipient {
	return {
		class: RECIPIENT_TYPE_USER,
		value: 'alice',
		instance: null,
		display_name: 'Alice',
		icon: null,
		secret: { updatable: false },
		initiator: null,
		...overrides,
	}
}

describe('recipientToNcSelectUsersModel', () => {
	it('maps a user to the native avatar (no icon, no subname)', () => {
		const model = recipientToNcSelectUsersModel(makeRecipient())

		expect(model.id).toBe('alice')
		expect(model.user).toBe('alice')
		expect(model.displayName).toBe('Alice')
		expect(model.isNoUser).toBe(false)
		expect(model.iconSvg).toBeUndefined()
		expect(model.subname).toBeUndefined()
	})

	it('gives an email recipient a mail icon and the address as subname', () => {
		const model = recipientToNcSelectUsersModel(makeRecipient({
			class: RECIPIENT_TYPE_EMAIL,
			value: 'bob@example.com',
			display_name: 'Bob',
		}))

		expect(model.isNoUser).toBe(true)
		expect(model.iconSvg).toContain('<svg')
		expect(model.subname).toBe('bob@example.com')
	})

	it('gives a group recipient a group icon and no subname', () => {
		const model = recipientToNcSelectUsersModel(makeRecipient({
			class: RECIPIENT_TYPE_GROUP,
			value: 'admins',
			display_name: 'Admins',
		}))

		expect(model.isNoUser).toBe(true)
		expect(model.iconSvg).toContain('<svg')
		expect(model.subname).toBeUndefined()
	})

	it('gives a team recipient an icon', () => {
		const model = recipientToNcSelectUsersModel(makeRecipient({
			class: RECIPIENT_TYPE_TEAM,
			value: 'team1',
			display_name: 'Team One',
		}))

		expect(model.iconSvg).toContain('<svg')
	})

	it('shows the instance on a second line for federated recipients', () => {
		const model = recipientToNcSelectUsersModel(makeRecipient({
			instance: 'cloud.example.com',
		}))

		expect(model.subname).toContain('cloud.example.com')
	})

	it('falls back to a backend-provided icon for unknown types', () => {
		const model = recipientToNcSelectUsersModel(makeRecipient({
			class: 'OC\\Some\\Custom\\RecipientType',
			icon: { svg: '<svg data-test="custom" />' },
		}))

		expect(model.isNoUser).toBe(true)
		expect(model.iconSvg).toBe('<svg data-test="custom" />')
	})

	it('has no icon for an unknown type without a backend icon', () => {
		const model = recipientToNcSelectUsersModel(makeRecipient({
			class: 'OC\\Some\\Custom\\RecipientType',
		}))

		expect(model.iconSvg).toBeUndefined()
	})
})
