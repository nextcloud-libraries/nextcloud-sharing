/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import type { INode } from '@nextcloud/files'
import type { ShallowRef } from 'vue'
import type {
	SharingPermission,
	SharingProperty,
	SharingRecipient,
	SharingShare,
	SharingSource,
	SharingState,
} from '../types/api.ts'

import { shallowRef } from 'vue'
import { SOURCE_TYPE_NODE } from '../constants.ts'
import * as client from './sharing.ts'

// Recipient search is not bound to a share; re-export the low-level helper as is.
export { searchRecipients } from './sharing.ts'

/**
 * A share from the unified sharing API.
 *
 * The server is the source of truth: every mutation round-trips to the backend
 * and the returned schema replaces the instance's data. The data is held in a
 * `shallowRef`, so Vue components that read {@link Share.prototype.data} (or any
 * of the convenience getters) re-render when a mutation resolves.
 *
 * Obtain one with {@link createShare} (a new draft) or {@link getShare} (fetch
 * an existing share). The class is exported as a type only; instances are always
 * produced by these helpers, never constructed directly.
 */
class Share {
	readonly #data: ShallowRef<SharingShare>

	constructor(data: SharingShare) {
		this.#data = shallowRef(data)
	}

	/** The full share schema (reactive). */
	get data(): SharingShare {
		return this.#data.value
	}

	/** The share id. */
	get id(): string {
		return this.#data.value.id
	}

	/** The share state (draft / active / deleted). */
	get state(): SharingState {
		return this.#data.value.state
	}

	/** The share sources. */
	get sources(): SharingSource[] {
		return this.#data.value.sources
	}

	/** The share recipients. */
	get recipients(): SharingRecipient[] {
		return this.#data.value.recipients
	}

	/** The share properties. */
	get properties(): SharingProperty[] {
		return this.#data.value.properties
	}

	/** The share permissions. */
	get permissions(): SharingPermission[] {
		return this.#data.value.permissions
	}

	/** The class of the preset matching the enabled permissions, null when custom. */
	get permissionPreset(): string | null {
		return this.#data.value.permission_preset
	}

	/**
	 * Replace the instance data with a fresh schema from the backend.
	 *
	 * @param data The updated share schema
	 */
	#sync(data: SharingShare): this {
		this.#data.value = data
		return this
	}

	/**
	 * Add a source to the share.
	 *
	 * @param sourceClass The source type class
	 * @param sourceValue The source value
	 */
	async addSource(sourceClass: string, sourceValue: string): Promise<this> {
		return this.#sync(await client.addShareSource(this.id, sourceClass, sourceValue))
	}

	/**
	 * Add a file or folder as the share's source.
	 *
	 * @param node The node to share
	 */
	async addNode(node: INode): Promise<this> {
		return this.addSource(SOURCE_TYPE_NODE, node.fileid!.toString())
	}

	/**
	 * Remove a source from the share.
	 *
	 * @param sourceClass The source type class
	 * @param sourceValue The source value
	 */
	async removeSource(sourceClass: string, sourceValue: string): Promise<this> {
		return this.#sync(await client.removeShareSource(this.id, sourceClass, sourceValue))
	}

	/**
	 * Add a recipient to the share.
	 *
	 * @param recipientClass The recipient type class
	 * @param recipientValue The recipient value
	 * @param instance The recipient's instance (federated shares)
	 */
	async addRecipient(recipientClass: string, recipientValue: string, instance?: string): Promise<this> {
		return this.#sync(await client.addShareRecipient(this.id, recipientClass, recipientValue, instance))
	}

	/**
	 * Remove a recipient from the share.
	 *
	 * @param recipientClass The recipient type class
	 * @param recipientValue The recipient value
	 * @param instance The recipient's instance (federated shares)
	 */
	async removeRecipient(recipientClass: string, recipientValue: string, instance?: string): Promise<this> {
		return this.#sync(await client.removeShareRecipient(this.id, recipientClass, recipientValue, instance))
	}

	/**
	 * Update the secret of a recipient.
	 *
	 * @param recipientClass The recipient type class
	 * @param recipientValue The recipient value
	 * @param secret The new secret
	 * @param instance The recipient's instance (federated shares)
	 */
	async setRecipientSecret(recipientClass: string, recipientValue: string, secret: string, instance?: string): Promise<this> {
		return this.#sync(await client.updateShareRecipientSecret(this.id, recipientClass, recipientValue, secret, instance))
	}

	/**
	 * Set a property value. Pass null to unset it.
	 *
	 * @param propertyClass The property type class
	 * @param value The new value, or null to unset
	 */
	async setProperty(propertyClass: string, value: string | null): Promise<this> {
		return this.#sync(await client.updateShareProperty(this.id, propertyClass, value))
	}

	/**
	 * Enable or disable a single permission.
	 *
	 * @param permissionClass The permission type class
	 * @param enabled The new enabled state
	 */
	async setPermission(permissionClass: string, enabled: boolean): Promise<this> {
		return this.#sync(await client.updateSharePermission(this.id, permissionClass, enabled))
	}

	/**
	 * Apply a permission preset. The backend enables the preset's permissions
	 * and disables the rest.
	 *
	 * @param presetClass The preset class to apply
	 */
	async selectPreset(presetClass: string): Promise<this> {
		return this.#sync(await client.selectSharePermissionPreset(this.id, presetClass))
	}

	/**
	 * Set the share state (draft → active → deleted).
	 *
	 * @param state The new state
	 */
	async setState(state: SharingState): Promise<this> {
		return this.#sync(await client.updateShareState(this.id, state))
	}

	/**
	 * Activate the share (make the draft live).
	 */
	async activate(): Promise<this> {
		return this.setState('active')
	}

	/**
	 * Reload the share from the backend.
	 */
	async refresh(): Promise<this> {
		return this.#sync(await client.getShare(this.id))
	}

	/**
	 * Delete the share permanently.
	 */
	async delete(): Promise<void> {
		await client.deleteShare(this.id)
	}

	/**
	 * Open the sharing dialog bound to this share.
	 * Resolves once the dialog is closed.
	 *
	 * @param node The node backing the share, used for the dialog title
	 */
	async showDialog(node?: INode): Promise<unknown> {
		const [{ spawnDialog }, { default: SharingDialog }] = await Promise.all([
			import('@nextcloud/vue/functions/dialog'),
			import('../SharingDialog.vue'),
		])
		return spawnDialog(SharingDialog, { share: this, node })
	}
}

/**
 * Create a new draft share.
 */
export async function createShare(): Promise<Share> {
	return new Share(await client.createShare())
}

/**
 * Fetch an existing share by id.
 *
 * @param id The share id
 * @param secret A recipient secret granting access, if any
 * @param args Extra arguments forwarded to the backend (e.g. a password)
 */
export async function getShare(id: string, secret?: string | null, args?: Record<string, unknown>): Promise<Share> {
	return new Share(await client.getShare(id, secret, args))
}

// Exported as a type only: instances are produced by the helpers above, the
// class itself is never constructable by consumers.
export type { Share }
