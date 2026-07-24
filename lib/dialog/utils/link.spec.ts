/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import type { Share } from '../api/share.ts'

import { describe, expect, it, vi } from 'vitest'
import { RECIPIENT_TYPE_TOKEN, SOURCE_TYPE_NODE } from '../constants.ts'
import { generateShareToken, resolveShareLink } from './link.ts'

vi.mock('@nextcloud/router', () => ({
	generateUrl: (url: string, params: Record<string, string>) => url.replace(/\{(\w+)\}/g, (_, k) => params[k]),
}))

/**
 * Build a fake share exposing the getters resolveShareLink reads.
 *
 * @param recipients Recipients array
 * @param sources Sources array
 */
function fakeShare(recipients: unknown[], sources: unknown[]): Share {
	return { recipients, sources } as unknown as Share
}

describe('generateShareToken', () => {
	it('returns a UUID within the 32-255 char link constraint', () => {
		const token = generateShareToken()
		expect(token).toMatch(/^[0-9a-f-]{36}$/)
		expect(token.length).toBeGreaterThanOrEqual(32)
	})
})

describe('resolveShareLink', () => {
	it('returns the token recipient secret URL for a public link', () => {
		const share = fakeShare(
			[{ class: RECIPIENT_TYPE_TOKEN, secret: { url: 'https://cloud/s/abc' } }],
			[],
		)
		expect(resolveShareLink(share, true)).toBe('https://cloud/s/abc')
	})

	it('returns null for a public link without a token recipient', () => {
		expect(resolveShareLink(fakeShare([], []), true)).toBeNull()
	})

	it('returns the private file link from the node source', () => {
		const share = fakeShare([], [{ class: SOURCE_TYPE_NODE, value: '42' }])
		expect(resolveShareLink(share, false)).toBe(`${window.location.origin}/f/42`)
	})

	it('returns null for a private link without a node source', () => {
		expect(resolveShareLink(fakeShare([], []), false)).toBeNull()
	})
})
