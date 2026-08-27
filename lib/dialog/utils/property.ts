/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import type { SharingProperty } from '../types/api.ts'

/**
 * Whether a string property is long enough to warrant a textarea.
 *
 * @param property The share property
 */
export function isLongTextProperty(property: SharingProperty): boolean {
	return property.type === 'string' && (property.max_length ?? 0) > 255
}

/**
 * Whether a property can be toggled on/off (optional). Booleans are always
 * shown as a switch, so they are never treated as optional here.
 *
 * @param property The share property
 */
export function isOptionalProperty(property: SharingProperty): boolean {
	if (property.type === 'boolean') {
		return false
	}
	return !property.required
}

/**
 * A suitable initial value when a property is enabled, based on its type.
 * String/password/date start empty so enabling the toggle does not persist
 * until the user provides a value.
 *
 * @param property The share property
 */
export function defaultPropertyValue(property: SharingProperty): string {
	switch (property.type) {
		case 'boolean':
			return 'false'
		case 'enum':
			return property.valid_values?.[0] ?? ''
		case 'string':
		case 'password':
		case 'date':
		default:
			return ''
	}
}
