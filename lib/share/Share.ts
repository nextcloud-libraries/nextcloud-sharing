/*!
 * SPDX-FileCopyrightText: 2025 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import type { ShareType } from './ShareType.ts'

export type ShareAttribute = {
	value: boolean
	key: string
	scope: string
}

export interface IGenericShare {
	/**
	 * The share id
	 */
	id: number

	/**
	 * The share type
	 */
	type: ShareType

	/**
	 * The generic share attributes
	 */
	attributes: ShareAttribute[]

	/**
	 * The share creation timestamp (in seconds since UNIX epoch)
	 */
	createdTime: number

	/**
	 * The share permissions for the share receiver.
	 *
	 * A bitmask of the share permissions like `SharePermission.Read | SharePermission.Write`.
	 * These are not the permissions for the current user but for the share recipient (shareWith).
	 */
	permissions: number

	/**
	 * Whether the current user can edit this share.
	 * Only relevant for existing shares.
	 */
	readonly canEdit: boolean

	/**
	 * Whether the current user can delete this share.
	 * Only relevant for existing shares.
	 */
	readonly canDelete: boolean

	/**
	 * The uid of the share owner
	 */
	owner: string

	/**
	 * The displayname of the share owner
	 */
	ownerDisplayname: string

	/**
	 * Get the share with entity id
	 */
	shareWith: string

	/**
	 * The displayname of the entity this was shared with
	 */
	shareWithDisplayname: string

	/**
	 * In case of multiple shares with the same entity this is the unique displayname.
	 */
	shareWithDisplaynameUnique: string

	/**
	 * The uid of the owner of the shared file or folder.
	 */
	fileOwner: string

	/**
	 * The displayname of the owner of the shared file or folder.
	 */
	fileOwnerDisplayname: string

	/**
	 * Hide the download functionalities for the shared nodes.
	 * This obfuscates the download buttons for such shares.
	 */
	hideDownload: boolean

	/**
	 * Have a mail been sent to the share recipient
	 */
	mailSend: boolean

	/**
	 * The share note
	 */
	note?: string

	/**
	 * The share label
	 */
	label?: string

	/**
	 * The share expiration date in "YYYY-MM-DD HH:mm" format
	 */
	expireDate?: `${number}-${number}-${number} ${number}:${number}`
}

export interface ILinkShare extends IGenericShare {
	/**
	 * @inheritdoc
	 */
	type: ShareType.Link | ShareType.Email

	/**
	 * The share token
	 */
	token: string

	/**
	 * The share password
	 */
	password: string

	/**
	 * Password expiration time as "YYYY-MM-DD HH:mm" format
	 */
	passwordExpirationTime: `${number}-${number}-${number} ${number}:${number}`

	/**
	 * Password should be sent to recipient using Nextcloud Talk
	 */
	sendPasswordByTalk: boolean
}

export interface IRemoteShare extends IGenericShare {
	/**
	 * @inheritdoc
	 */
	type: ShareType.Remote | ShareType.RemoteGroup

	/**
	 * Is the share from a trusted remote server
	 */
	isTrustedServer: boolean
}

export type IInternalShare = IGenericShare

export type IShare = ILinkShare | IInternalShare | IRemoteShare
