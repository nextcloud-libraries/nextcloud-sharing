/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import { describe, expect, it } from 'vitest'
import { shareOutcomeSummary } from './summary.ts'

const date = new Date('2026-08-01T15:30:00')

describe('shareOutcomeSummary', () => {
	it('returns null when the share neither expires nor is protected', () => {
		expect(shareOutcomeSummary(null, false)).toBeNull()
	})

	it('mentions only the password when protected without expiry', () => {
		const summary = shareOutcomeSummary(null, true)
		expect(summary).toContain('password protected')
		expect(summary).not.toContain('expire')
	})

	it('mentions only the expiry when expiring without a password', () => {
		const summary = shareOutcomeSummary(date, false)
		expect(summary).toContain('expire on')
		expect(summary).toContain(date.toLocaleDateString())
		expect(summary).not.toContain('password')
	})

	it('mentions both expiry and password when both apply', () => {
		const summary = shareOutcomeSummary(date, true)
		expect(summary).toContain('expire on')
		expect(summary).toContain('password protected')
		expect(summary).toContain(date.toLocaleDateString())
	})
})
