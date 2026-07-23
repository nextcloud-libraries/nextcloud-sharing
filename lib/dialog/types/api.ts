/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

// --- Icons ---

export interface SharingIconSVG {
	svg: string
}

export interface SharingIconURL {
	light: string
	dark: string
}

export type SharingIcon = SharingIconSVG | SharingIconURL

/**
 *
 * @param icon
 */
export function isSvgIcon(icon: SharingIcon): icon is SharingIconSVG {
	return 'svg' in icon
}

// --- Source ---

export interface SharingSource {
	class: string
	value: string
	display_name: string
	icon: SharingIcon | null
}

// --- Recipient ---

export interface SharingRecipientSecret {
	updatable: boolean
	/** The secret/token value, only present when the recipient type exposes it publicly */
	value?: string
	/** Absolute share URL derived from the secret, present for public (token) recipients */
	url?: string
}

export interface SharingRecipient {
	class: string
	value: string
	instance: string | null
	display_name: string
	icon: SharingIcon | null
	secret: SharingRecipientSecret
	initiator: SharingOwner | null
}

// --- Owner ---

export interface SharingOwner {
	user_id: string
	instance: string | null
	display_name: string
	icon: SharingIcon
}

// --- Property ---

export type SharingPropertyType = 'boolean' | 'string' | 'date' | 'enum' | 'password'

export interface SharingProperty {
	class: string
	display_name: string
	hint: string | null
	priority: number
	required: boolean
	value: string | null
	type: SharingPropertyType
	// String-specific
	min_length?: number | null
	max_length?: number | null
	// Date-specific
	min_date?: string | null
	max_date?: string | null
	// Enum-specific
	valid_values?: string[]
}

// --- Permission ---

/** A permission preset registered on the server, e.g. "Can view" or "Can edit" */
export interface SharingPermissionPreset {
	class: string
	display_name: string
	hint: string | null
}

export interface SharingPermission {
	class: string
	source_class: string | null
	display_name: string
	hint: string | null
	priority: number
	/** Classes of the presets this permission belongs to */
	presets: string[]
	enabled: boolean
}

// --- Capabilities ---

export interface SharingSourceType {
	class: string
}

export interface SharingCapabilities {
	sharing: {
		api_versions: string[]
		source_types: SharingSourceType[]
		permission_presets: SharingPermissionPreset[]
	}
}

// --- Share ---

export type SharingState = 'active' | 'draft' | 'deleted'

export interface SharingShare {
	id: string
	owner: SharingOwner
	last_updated: number
	state: SharingState
	sources: SharingSource[]
	recipients: SharingRecipient[]
	properties: SharingProperty[]
	permissions: SharingPermission[]
	/** Class of the preset matching the enabled permissions, null when custom */
	permission_preset: string | null
}
