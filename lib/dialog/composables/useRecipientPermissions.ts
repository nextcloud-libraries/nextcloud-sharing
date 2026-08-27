/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import type { Share } from '../api/share.ts'
import type { SharingCapabilities, SharingPermission, SharingPermissionPreset, SharingRecipient } from '../types/api.ts'

import { getCapabilities } from '@nextcloud/capabilities'
import { computed, reactive, ref } from 'vue'
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
 * Per-recipient permission editing. The share-level permissions are the maximum:
 * a recipient's available presets and toggles are capped at the permissions the
 * share currently grants. The backend enforces the real cap (the sharer's own
 * permissions on a reshare, or the admin default).
 *
 * @param share The share being edited
 * @param getRecipient Getter for the recipient this controller edits (kept
 *   reactive so it tracks the share re-syncing after a mutation)
 */
export function useRecipientPermissions(share: Share, getRecipient: () => SharingRecipient) {
	const capabilityPresets: SharingPermissionPreset[] = (getCapabilities() as Partial<SharingCapabilities>).sharing?.permission_presets ?? []
	const customOption: PresetOption = { value: CUSTOM_VALUE, label: t('Can…') }

	const permissionErrors = reactive<Record<string, string>>({})
	const presetError = ref<string | null>(null)

	const recipient = computed(getRecipient)

	/** Classes of the permissions the share currently grants (the maximum). */
	const shareMax = computed(() => new Set(share.permissions.filter((permission) => permission.enabled).map((permission) => permission.class)))

	/** Presets whose member permissions are all within the share max. */
	const presetOptions = computed<PresetOption[]>(() => {
		const max = shareMax.value
		const available = capabilityPresets.filter((preset) => {
			const members = share.permissions.filter((permission) => permission.presets.includes(preset.class))
			return members.length > 0 && members.every((permission) => max.has(permission.class))
		})
		return [
			...available.map((preset) => ({ value: preset.class, label: preset.display_name })),
			customOption,
		]
	})

	const selectedPreset = computed<PresetOption>(() => presetOptions.value.find((option) => option.value === recipient.value.permission_preset) ?? customOption)

	const showPermissions = computed(() => selectedPreset.value.value === CUSTOM_VALUE)

	const permissions = computed<RecipientPermission[]>(() => {
		const max = shareMax.value
		// The backend may not (yet) return per-recipient permissions.
		return (recipient.value.permissions ?? []).map((permission) => ({
			...permission,
			available: max.has(permission.class),
		}))
	})

	/** Whether any permission is beyond the share max (drives the cap notice). */
	const hasCap = computed(() => permissions.value.some((permission) => !permission.available))

	/** Human-readable label of the share's maximum (its preset, else generic). */
	const maxLabel = computed(() => {
		const preset = capabilityPresets.find((p) => p.class === share.permissionPreset)
		return preset?.display_name ?? t('the share\'s permissions')
	})

	/** Info notice explaining the cap, shown only when something is not grantable. */
	const notice = computed<string | null>(() => {
		if (!hasCap.value) {
			return null
		}
		// A reshare: this recipient was added by someone other than the share owner.
		const initiator = recipient.value.initiator
		const isReshare = initiator !== null && initiator.user_id !== share.data.owner.user_id
		if (isReshare) {
			return t('{owner} shared this with you as "{permission}". You can only grant the same or fewer permissions.', {
				owner: share.data.owner.display_name,
				permission: maxLabel.value,
			})
		}
		return t('This share is limited to "{permission}". You can only grant the same or fewer permissions.', {
			permission: maxLabel.value,
		})
	})

	/**
	 * Apply a preset to the recipient, or reveal the custom toggles.
	 *
	 * @param option The selected preset option
	 */
	async function onPresetChange(option: PresetOption | null) {
		if (!option || option.value === CUSTOM_VALUE) {
			return
		}
		presetError.value = null
		const r = recipient.value
		try {
			await share.selectRecipientPreset(r.class, r.value, option.value, r.instance ?? undefined)
		} catch (e) {
			logger.error('Failed to select recipient permission preset', { error: e, recipient: r.value, preset: option.value })
			presetError.value = getOcsErrorMessage(e)
		}
	}

	/**
	 * Toggle a single permission for the recipient.
	 *
	 * @param permission The permission to toggle
	 * @param enabled The new enabled state
	 */
	async function onPermissionToggle(permission: SharingPermission, enabled: boolean) {
		delete permissionErrors[permission.class]
		const r = recipient.value
		try {
			await share.setRecipientPermission(r.class, r.value, permission.class, enabled, r.instance ?? undefined)
		} catch (e) {
			logger.error('Failed to toggle recipient permission', { error: e, recipient: r.value, permission: permission.class })
			permissionErrors[permission.class] = getOcsErrorMessage(e)
		}
	}

	return {
		presetOptions,
		selectedPreset,
		showPermissions,
		permissions,
		hasCap,
		notice,
		permissionErrors,
		presetError,
		onPresetChange,
		onPermissionToggle,
	}
}
