/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import type { OCSResponse } from '@nextcloud/typings/ocs'
import type { NcSelectUsersModel } from '@nextcloud/vue/components/NcSelectUsers'
import type { SharingIcon, SharingRecipient } from '../types/api.ts'

import IconAccountGroup from '@mdi/svg/svg/account-group-outline.svg?raw'
import IconAccountMultiple from '@mdi/svg/svg/account-multiple-outline.svg?raw'
import IconEmail from '@mdi/svg/svg/email-outline.svg?raw'
import {
	RECIPIENT_TYPE_EMAIL,
	RECIPIENT_TYPE_GROUP,
	RECIPIENT_TYPE_TEAM,
	RECIPIENT_TYPE_USER,
} from '../constants.ts'
import { isSvgIcon } from '../types/api.ts'
import { t } from './l10n.ts'

/**
 * Type-specific icons rendered on the frontend for recipient types that do not
 * carry an avatar. Users are intentionally absent: they use their avatar.
 */
const RECIPIENT_TYPE_ICONS: Record<string, string> = {
	[RECIPIENT_TYPE_EMAIL]: IconEmail,
	[RECIPIENT_TYPE_GROUP]: IconAccountGroup,
	[RECIPIENT_TYPE_TEAM]: IconAccountMultiple,
}

type OcsError = { response?: { data?: OCSResponse<unknown> } }

/**
 * Extract the human-readable error message from a failed OCS request.
 * The real message lives in `ocs.data` (or `ocs.meta.message`); the axios
 * error itself only carries a generic "Request failed with status code …".
 *
 * @param error The caught error
 * @return The backend message, or a generic fallback
 */
export function getOcsErrorMessage(error: unknown): string {
	const ocs = (error as OcsError)?.response?.data?.ocs
	if (typeof ocs?.data === 'string' && ocs.data !== '') {
		return ocs.data
	}
	if (ocs?.meta?.message) {
		return ocs.meta.message
	}
	return error instanceof Error ? error.message : t('An unexpected error occurred')
}

/**
 * Detects if the user has dark mode enabled, either via media query
 * or by checking the enabled theming settings in Nextcloud.
 */
function isDarkMode(): boolean {
	return window?.matchMedia?.('(prefers-color-scheme: dark)')?.matches === true
		|| document.querySelector('[data-themes*=dark]') !== null
}

/**
 * Convert a SharingIcon to an inline SVG string.
 * SVG icons are used directly; URL icons are wrapped in an <image> element.
 *
 * @param icon The icon to convert
 * @return An inline SVG string
 */
function iconToInlineSvg(icon: SharingIcon): string {
	if (isSvgIcon(icon)) {
		return icon.svg
	}

	const iconUrl = isDarkMode() ? icon.dark : icon.light
	return `<svg width="32" height="32" viewBox="0 0 32 32"
		xmlns="http://www.w3.org/2000/svg">
		<image href="${iconUrl}" height="32" width="32" />
	</svg>`
}

/**
 * Second line shown below a recipient's display name.
 * Federated recipients live on another instance; email recipients show the
 * address. Mirrors the rendering of the legacy files_sharing SharingInput.
 *
 * @param recipient The recipient from the sharing API
 */
function recipientSubname(recipient: SharingRecipient): string | undefined {
	if (recipient.instance) {
		return t('on {instance}', { instance: recipient.instance })
	}
	if (recipient.class === RECIPIENT_TYPE_EMAIL) {
		return recipient.value
	}
	return undefined
}

/**
 * Converts a SharingRecipient from the sharing API into the NcSelectUsersModel
 * format expected by the NcSelectUsers component. The visual variation per
 * recipient type is generated on the frontend: users rely on NcSelectUsers'
 * built-in avatar loading, known abstract types (email, group, team) get a
 * type-specific mdi icon, and any other type falls back to a backend-provided
 * icon when present.
 *
 * @param recipient The recipient from the sharing API
 * @return An NcSelectUsersModel object suitable for use in the NcSelectUsers component
 */
export function recipientToNcSelectUsersModel(recipient: SharingRecipient): NcSelectUsersModel {
	const isUser = recipient.class === RECIPIENT_TYPE_USER
	const iconSvg = isUser
		? undefined
		: RECIPIENT_TYPE_ICONS[recipient.class]
			?? (recipient.icon ? iconToInlineSvg(recipient.icon) : undefined)

	return {
		id: recipient.value,
		displayName: recipient.display_name,
		user: recipient.value,
		subname: recipientSubname(recipient),
		iconSvg,
		isNoUser: !isUser,
	}
}
