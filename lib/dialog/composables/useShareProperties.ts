/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import type { Share } from '../api/share.ts'
import type { SharingProperty } from '../types/api.ts'

import { computed, reactive, watch } from 'vue'
import { FIRST_PAGE_PROPERTIES, HIDDEN_PROPERTIES } from '../constants.ts'
import { logger } from '../utils/logger.ts'
import { defaultPropertyValue } from '../utils/property.ts'

/**
 * Manage the editable property list for a share: a local reactive copy kept in
 * sync with the backend, split into first-page and settings groups, plus the
 * enable/disable toggle for optional properties.
 *
 * @param share The share being edited
 */
export function useShareProperties(share: Share) {
	// Local reactive copy for two-way binding with PropertyField.
	const properties = reactive<SharingProperty[]>(share.properties.map((p) => ({ ...p })))

	/**
	 * Re-merge the local copy from the share on every backend round-trip,
	 * preserving local values for existing properties (unsaved edits) and adding
	 * any new ones.
	 *
	 * @param updated The share's current properties
	 */
	function mergeProperties(updated: SharingProperty[]) {
		const existing = new Map(properties.map((p) => [p.class, p]))
		properties.length = 0
		for (const p of updated) {
			const local = existing.get(p.class)
			properties.push(local ? { ...p, value: local.value } : { ...p })
		}
	}

	watch(() => share.properties, mergeProperties)

	const firstPageProperties = computed(() => properties.filter((p) => FIRST_PAGE_PROPERTIES.includes(p.class)))

	const settingsProperties = computed(() => properties.filter((p) => !HIDDEN_PROPERTIES.includes(p.class)
		&& !FIRST_PAGE_PROPERTIES.includes(p.class)))

	const hasSettingsWarning = computed(() => settingsProperties.value.some((p) => p.required && (p.value === null || p.value === '')))

	const hasSettings = computed(() => settingsProperties.value.length > 0)

	/**
	 * Toggle an optional property on/off.
	 *
	 * Enabling only reveals the field locally — an empty value is not persisted
	 * because the backend rejects it (PropertyField saves it once the user types).
	 * Disabling persists null to clear the property.
	 *
	 * @param property The property to toggle
	 * @param enabled The new enabled state
	 */
	async function toggleOptionalProperty(property: SharingProperty, enabled: boolean) {
		const previousValue = property.value
		const newValue = enabled ? defaultPropertyValue(property) : null
		property.value = newValue

		// Don't dispatch an empty value on enable; wait for the user to type one.
		if (enabled && (newValue === null || newValue === '')) {
			return
		}

		try {
			await share.setProperty(property.class, newValue)
		} catch (e) {
			// Revert the toggle; the reverted state is the user-facing feedback.
			property.value = previousValue
			logger.error('Failed to toggle property', { error: e })
		}
	}

	return {
		properties,
		firstPageProperties,
		settingsProperties,
		hasSettingsWarning,
		hasSettings,
		toggleOptionalProperty,
	}
}
