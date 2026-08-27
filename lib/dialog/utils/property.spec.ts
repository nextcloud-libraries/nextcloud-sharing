/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import type { SharingProperty } from '../types/api.ts'

import { describe, expect, it } from 'vitest'
import { defaultPropertyValue, isLongTextProperty, isOptionalProperty } from './property.ts'

/**
 * Build a share property for testing.
 *
 * @param overrides Fields to override
 */
function property(overrides: Partial<SharingProperty> = {}): SharingProperty {
	return {
		class: 'C',
		display_name: 'Prop',
		hint: null,
		priority: 10,
		required: false,
		value: null,
		type: 'string',
		...overrides,
	}
}

describe('isLongTextProperty', () => {
	it('is true for a string over 255 chars', () => {
		expect(isLongTextProperty(property({ type: 'string', max_length: 500 }))).toBe(true)
	})

	it('is false for a short string', () => {
		expect(isLongTextProperty(property({ type: 'string', max_length: 64 }))).toBe(false)
	})

	it('is false for non-string types', () => {
		expect(isLongTextProperty(property({ type: 'date' }))).toBe(false)
	})
})

describe('isOptionalProperty', () => {
	it('is false for booleans (always shown as a switch)', () => {
		expect(isOptionalProperty(property({ type: 'boolean' }))).toBe(false)
	})

	it('is false for required properties', () => {
		expect(isOptionalProperty(property({ required: true }))).toBe(false)
	})

	it('is true for an optional non-boolean property', () => {
		expect(isOptionalProperty(property({ required: false, type: 'string' }))).toBe(true)
	})
})

describe('defaultPropertyValue', () => {
	it('is "false" for booleans', () => {
		expect(defaultPropertyValue(property({ type: 'boolean' }))).toBe('false')
	})

	it('is the first valid value for enums', () => {
		expect(defaultPropertyValue(property({ type: 'enum', valid_values: ['a', 'b'] }))).toBe('a')
	})

	it('is empty for string/password/date', () => {
		expect(defaultPropertyValue(property({ type: 'string' }))).toBe('')
		expect(defaultPropertyValue(property({ type: 'password' }))).toBe('')
		expect(defaultPropertyValue(property({ type: 'date' }))).toBe('')
	})
})
