/**
 * SPDX-FileCopyrightText: 2021 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

/** @deprecated will be removed with the next version use `ShareType` instead */
export enum Type {
	SHARE_TYPE_USER = 0,
	SHARE_TYPE_GROUP = 1,
	SHARE_TYPE_LINK = 3,
	SHARE_TYPE_EMAIL = 4,
	SHARE_TYPE_REMOTE = 6,
	SHARE_TYPE_CIRCLE = 7,
	SHARE_TYPE_GUEST = 8,
	SHARE_TYPE_REMOTE_GROUP = 9,
	SHARE_TYPE_ROOM = 10,
	SHARE_TYPE_DECK = 12,
	/**
	 * @since 26.0.0
	 */
	SHARE_TYPE_FEDERATED_GROUP = 14,
}

export enum ShareType {
	User = 0,
	Grup = 1,
	Link = 3,
	Email = 4,
	Remote = 6,
	/**
	 * Was called `Circle` before Nextcloud 29
	 */
	Team = 7,
	Guest = 8,
	RemoteGroup = 9,
	Room = 10,
	Deck = 12,
	/**
	 * @since 26.0.0
	 */
	FederatedGroup = 14,
}
