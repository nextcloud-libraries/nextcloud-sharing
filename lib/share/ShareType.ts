/*!
 * SPDX-FileCopyrightText: 2025 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

export enum ShareType {
	User = 0,
	Group = 1,
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
	/**
	 * Third party share types
	 *
	 * @since 25.0.0
	 */
	ScienceMesh = 15,
}
