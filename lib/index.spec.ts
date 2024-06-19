/**
 * SPDX-FileCopyrightText: 2024 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: CC0-1.0
 */
import { expect, test } from 'vitest'
import { Type } from '.'

test('ShareType', () => {
	for (const type of Object.values(Type)) {
		if (typeof type === 'string') {
			// This should be the key of the enum, so we should be able to get the value
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			expect((Type as any)[type]).toBeTypeOf('number')
		} else {
			expect(type).toBeTypeOf('number')
			expect(Type[type]).toBeTypeOf('string')
		}
	}
})
