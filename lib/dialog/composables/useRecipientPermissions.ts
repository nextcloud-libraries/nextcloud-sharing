/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import type { Share } from '../api/share.ts'
import type { SharingCapabilities, SharingPermission, SharingPermissionPreset, SharingRecipient } from '../types/api.ts'

import { getCapabilities } from '@nextcloud/capabilities'
import { reactive } from 'vue'
import { getOcsErrorMessage } from '../utils/api.ts'
import { t } from '../utils/l10n.ts'
import { logger } from '../utils/logger.ts'

/** Sentinel for the "custom" entry that reveals the individual permission toggles. */
export const CUSTOM_VALUE = 'custom'

export interface PresetOption {
	value: string
	label: string
}

/** A recipient permission toggle, disabled when it would exceed the share max. */
export interface RecipientPermission extends SharingPermission {
	/** Whether the toggle can be changed (the share grants this permission). */
	available: boolean
}

/**
 * Stable identity key for a recipient (class + value + instance).
 *
 * @param recipient The recipient
 */
function recipientKey(recipient: SharingRecipient): string {
	return `${recipient.class}:${recipient.value}:${recipient.instance ?? ''}`
}

/**
 * Manage per-recipient permission editing. The share-level permissions are the
 * maximum: a recipient's available presets and toggles are capped at the
 * permissions the share currently grants. The backend enforces the real cap
 * (the sharer's own permissions on a reshare, or the admin default).
 *
 * @param share The share being edited
 */
export function useRecipientPermissions(share: Share) {
	const capabilityPresets: SharingPermissionPreset[] = (getCapabilities() as Partial<SharingCapabilities>).sharing?.permission_presets ?? []
	const customOption: PresetOption = { value: CUSTOM_VALUE, label: t('Can…') }

	// Backend rejection errors, keyed by recipient then permission/preset.
	const permissionErrors = reactive<Record<string, Record<string, string>>>({})
	const presetErrors = reactive<Record<string, string | null>>({})

	/** Classes of the permissions the share currently grants (the maximum). */
	function shareMax(): Set<string> {
		return new Set(share.permissions.filter((permission) => permission.enabled).map((permission) => permission.class))
	}

	/**
	 * The presets a recipient may be given: registered presets whose member
	 * permissions are all within the share's granted permissions.
	 */
	function recipientPresetOptions(): PresetOption[] {
		const max = shareMax()
		const available = capabilityPresets.filter((preset) => {
			const members = share.permissions.filter((permission) => permission.presets.includes(preset.class))
			return members.length > 0 && members.every((permission) => max.has(permission.class))
		})
		return [
			...available.map((preset) => ({ value: preset.class, label: preset.display_name })),
			customOption,
		]
	}

	/**
	 * The currently-selected preset option for a recipient (custom when null).
	 *
	 * @param recipient The recipient
	 */
	function recipientSelectedPreset(recipient: SharingRecipient): PresetOption {
		const options = recipientPresetOptions()
		return options.find((option) => option.value === recipient.permission_preset) ?? customOption
	}

	/**
	 * The recipient's permission toggles, each flagged with whether it is within
	 * the share maximum (disabled otherwise).
	 *
	 * @param recipient The recipient
	 */
	function recipientPermissions(recipient: SharingRecipient): RecipientPermission[] {
		const max = shareMax()
		return recipient.permissions.map((permission) => ({
			...permission,
			available: max.has(permission.class),
		}))
	}

	/**
	 * Apply a preset to a recipient, or reveal the custom toggles.
	 *
	 * @param recipient The recipient
	 * @param option The selected preset option
	 */
	async function onRecipientPresetChange(recipient: SharingRecipient, option: PresetOption | null) {
		if (!option || option.value === CUSTOM_VALUE) {
			return
		}
		const key = recipientKey(recipient)
		presetErrors[key] = null
		try {
			await share.selectRecipientPreset(recipient.class, recipient.value, option.value, recipient.instance ?? undefined)
		} catch (e) {
			logger.error('Failed to select recipient permission preset', { error: e, recipient: recipient.value, preset: option.value })
			presetErrors[key] = getOcsErrorMessage(e)
		}
	}

	/**
	 * Toggle a single permission for a recipient.
	 *
	 * @param recipient The recipient
	 * @param permission The permission to toggle
	 * @param enabled The new enabled state
	 */
	async function onRecipientPermissionToggle(recipient: SharingRecipient, permission: SharingPermission, enabled: boolean) {
		const key = recipientKey(recipient)
		permissionErrors[key] ??= {}
		delete permissionErrors[key][permission.class]
		try {
			await share.setRecipientPermission(recipient.class, recipient.value, permission.class, enabled, recipient.instance ?? undefined)
		} catch (e) {
			logger.error('Failed to toggle recipient permission', { error: e, recipient: recipient.value, permission: permission.class })
			permissionErrors[key][permission.class] = getOcsErrorMessage(e)
		}
	}

	return {
		recipientKey,
		recipientPresetOptions,
		recipientSelectedPreset,
		recipientPermissions,
		permissionErrors,
		presetErrors,
		onRecipientPresetChange,
		onRecipientPermissionToggle,
	}
}
