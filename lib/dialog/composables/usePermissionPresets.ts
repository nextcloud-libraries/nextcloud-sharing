/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import type { Share } from '../api/share.ts'
import type { SharingCapabilities, SharingPermission, SharingPermissionPreset } from '../types/api.ts'

import { getCapabilities } from '@nextcloud/capabilities'
import { computed, reactive, ref } from 'vue'
import { getOcsErrorMessage } from '../utils/api.ts'
import { t } from '../utils/l10n.ts'
import { logger } from '../utils/logger.ts'

/** Sentinel for the "custom" entry that reveals the individual permission toggles. */
const CUSTOM_VALUE = 'custom'

export interface PresetOption {
	value: string
	label: string
}

/**
 * Manage the permission preset selector and the fine-grained permission toggles
 * of a share.
 *
 * @param share The share being edited
 */
export function usePermissionPresets(share: Share) {
	// Presets registered on the server, with their translated display names.
	const capabilityPresets: SharingPermissionPreset[] = (getCapabilities() as Partial<SharingCapabilities>).sharing?.permission_presets ?? []
	const customOption: PresetOption = { value: CUSTOM_VALUE, label: t('Can…') }

	// Preserve first-seen order so toggling a permission never reorders the list
	// (the backend may return permissions in a different order after an update).
	const permissionOrder = new Map<string, number>()
	const permissions = computed<SharingPermission[]>(() => {
		for (const permission of share.permissions) {
			if (!permissionOrder.has(permission.class)) {
				permissionOrder.set(permission.class, permissionOrder.size)
			}
		}
		return [...share.permissions].sort((a, b) => (permissionOrder.get(a.class) ?? 0) - (permissionOrder.get(b.class) ?? 0))
	})

	// Presets offered by this share = the registered presets that at least one of
	// its permissions belongs to.
	const availablePresets = computed<SharingPermissionPreset[]>(() => {
		const seen = new Set<string>()
		for (const permission of permissions.value) {
			for (const presetClass of permission.presets) {
				seen.add(presetClass)
			}
		}
		return capabilityPresets.filter((preset) => seen.has(preset.class))
	})

	const presetOptions = computed<PresetOption[]>(() => [
		...availablePresets.value.map((preset) => ({ value: preset.class, label: preset.display_name })),
		customOption,
	])

	// Local selection so the custom view is sticky: once on "Can…" we keep it even
	// if edits happen to match a preset. Initialised from the backend (null === custom).
	const selectedValue = ref<string>(share.permissionPreset ?? CUSTOM_VALUE)
	const selectedPresetOption = computed<PresetOption | null>(() => presetOptions.value.find((o) => o.value === selectedValue.value) ?? null)
	const showPermissions = computed(() => selectedValue.value === CUSTOM_VALUE)

	// Backend rejection errors, surfaced where the change was made.
	const permissionErrors = reactive<Record<string, string>>({})
	const presetError = ref<string | null>(null)

	/**
	 * Apply a preset, or switch to the custom view. Picking a preset enables its
	 * permissions server-side; picking "Can…" only reveals the toggles.
	 *
	 * @param option The selected dropdown option
	 */
	async function onPresetChange(option: PresetOption | null) {
		if (!option) {
			return
		}
		selectedValue.value = option.value
		if (option.value === CUSTOM_VALUE) {
			return
		}
		presetError.value = null
		try {
			await share.selectPreset(option.value)
		} catch (e) {
			logger.error('Failed to select permission preset', { error: e, preset: option.value })
			presetError.value = getOcsErrorMessage(e)
		}
	}

	/**
	 * Toggle a single permission on the share.
	 *
	 * @param permission The permission to toggle
	 * @param enabled The new enabled state
	 */
	async function onPermissionToggle(permission: SharingPermission, enabled: boolean) {
		delete permissionErrors[permission.class]
		try {
			await share.setPermission(permission.class, enabled)
		} catch (e) {
			logger.error('Failed to toggle permission', { error: e, permission: permission.class })
			permissionErrors[permission.class] = getOcsErrorMessage(e)
		}
	}

	return {
		permissions,
		presetOptions,
		selectedPresetOption,
		showPermissions,
		permissionErrors,
		presetError,
		onPresetChange,
		onPermissionToggle,
	}
}
