/**
 * SPDX-FileCopyrightText: 2024 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: CC0-1.0
 */
import { expect, test } from 'vitest'
import { ShareType } from '.'

test('ShareType', () => {
	for (const type of Object.values(ShareType)) {
		if (typeof type === 'string') {
			// This should be the key of the enum, so we should be able to get the value

			expect((ShareType as any)[type]).toBeTypeOf('number')
		} else {
			expect(type).toBeTypeOf('number')
			expect(ShareType[type]).toBeTypeOf('string')
		}
	}
})
