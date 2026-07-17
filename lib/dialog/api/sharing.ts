/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import type { SharingRecipient, SharingShare, SharingState } from '../types/api.ts'

import axios from '@nextcloud/axios'
import { generateOcsUrl } from '@nextcloud/router'

/**
 *
 * @param path
 */
function sharingUrl(path: string): string {
	return generateOcsUrl('/apps/sharing/api/v1' + path)
}

/**
 *
 * @param response
 * @param response.data
 * @param response.data.ocs
 * @param response.data.ocs.data
 */
function unwrapOcs<T>(response: { data: { ocs: { data: T } } }): T {
	return response.data.ocs.data
}

/**
 * Create a new share draft.
 */
export async function createShare(): Promise<SharingShare> {
	const response = await axios.post(sharingUrl('/share'))
	return unwrapOcs<SharingShare>(response)
}

/**
 * Get a share by ID.
 * Uses POST because the endpoint accepts a request body for arguments.
 *
 * @param shareId
 * @param secret
 * @param args
 */
export async function getShare(shareId: string, secret?: string | null, args: Record<string, unknown> = {}): Promise<SharingShare> {
	const response = await axios.post(sharingUrl(`/share/${shareId}`), { secret: secret ?? null, arguments: args })
	return unwrapOcs<SharingShare>(response)
}

/**
 * Add a source to a share.
 *
 * @param shareId
 * @param sourceClass
 * @param sourceValue
 */
export async function addShareSource(shareId: string, sourceClass: string, sourceValue: string): Promise<SharingShare> {
	const response = await axios.post(sharingUrl(`/share/${shareId}/source`), {
		class: sourceClass,
		value: sourceValue,
	})
	return unwrapOcs<SharingShare>(response)
}

/**
 * Remove a source from a share.
 *
 * @param shareId
 * @param sourceClass
 * @param sourceValue
 */
export async function removeShareSource(shareId: string, sourceClass: string, sourceValue: string): Promise<SharingShare> {
	const response = await axios.delete(sharingUrl(`/share/${shareId}/source`), {
		params: { class: sourceClass, value: sourceValue },
	})
	return unwrapOcs<SharingShare>(response)
}

/**
 * Add a recipient to a share.
 *
 * @param shareId
 * @param recipientClass
 * @param recipientValue
 * @param instance
 */
export async function addShareRecipient(shareId: string, recipientClass: string, recipientValue: string, instance?: string): Promise<SharingShare> {
	const response = await axios.post(sharingUrl(`/share/${shareId}/recipient`), {
		class: recipientClass,
		value: recipientValue,
		instance: instance ?? null,
	})
	return unwrapOcs<SharingShare>(response)
}

/**
 * Remove a recipient from a share.
 *
 * @param shareId
 * @param recipientClass
 * @param recipientValue
 * @param instance
 */
export async function removeShareRecipient(shareId: string, recipientClass: string, recipientValue: string, instance?: string): Promise<SharingShare> {
	const response = await axios.delete(sharingUrl(`/share/${shareId}/recipient`), {
		params: { class: recipientClass, value: recipientValue, instance: instance ?? undefined },
	})
	return unwrapOcs<SharingShare>(response)
}

/**
 * Update the secret of a share recipient.
 *
 * @param shareId
 * @param recipientClass
 * @param recipientValue
 * @param secret
 * @param instance
 */
export async function updateShareRecipientSecret(shareId: string, recipientClass: string, recipientValue: string, secret: string, instance?: string): Promise<SharingShare> {
	const response = await axios.put(sharingUrl(`/share/${shareId}/recipient/secret`), {
		class: recipientClass,
		value: recipientValue,
		instance: instance ?? null,
		secret,
	})
	return unwrapOcs<SharingShare>(response)
}

/**
 * Update a property value on a share.
 *
 * @param shareId
 * @param propertyClass
 * @param value
 */
export async function updateShareProperty(shareId: string, propertyClass: string, value: string | null): Promise<SharingShare> {
	const response = await axios.put(sharingUrl(`/share/${shareId}/property`), {
		class: propertyClass,
		value,
	})
	return unwrapOcs<SharingShare>(response)
}

/**
 * Update a permission on a share.
 *
 * @param shareId
 * @param permissionClass
 * @param enabled
 */
export async function updateSharePermission(shareId: string, permissionClass: string, enabled: boolean): Promise<SharingShare> {
	const response = await axios.put(sharingUrl(`/share/${shareId}/permission`), {
		class: permissionClass,
		enabled,
	})
	return unwrapOcs<SharingShare>(response)
}

/**
 * Select a permission preset on a share.
 * The backend enables the permissions belonging to the preset and disables the rest.
 *
 * @param shareId Id of the share
 * @param presetClass Class of the preset to apply
 */
export async function selectSharePermissionPreset(shareId: string, presetClass: string): Promise<SharingShare> {
	const response = await axios.put(sharingUrl(`/share/${shareId}/permission/preset`), {
		permissionPresetClass: presetClass,
	})
	return unwrapOcs<SharingShare>(response)
}

/**
 * Update the state of a share (draft → active → deleted).
 *
 * @param shareId
 * @param state
 */
export async function updateShareState(shareId: string, state: SharingState): Promise<SharingShare> {
	const response = await axios.put(sharingUrl(`/share/${shareId}/state`), { state })
	return unwrapOcs<SharingShare>(response)
}

/**
 * Search for recipients by query.
 *
 * @param query
 * @param recipientTypeClass
 * @param limit
 * @param offset
 */
export async function searchRecipients(query: string, recipientTypeClass?: string, limit = 10, offset = 0): Promise<SharingRecipient[]> {
	const response = await axios.get(sharingUrl('/recipients'), {
		params: { query, recipientTypeClass, limit, offset },
	})
	return unwrapOcs<SharingRecipient[]>(response)
}

/**
 * Delete a share permanently.
 *
 * @param shareId
 */
export async function deleteShare(shareId: string): Promise<void> {
	await axios.delete(sharingUrl(`/share/${shareId}`))
}
