/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import type { NcSelectUsersModel } from '@nextcloud/vue/components/NcSelectUsers'
import type { SharingIcon, SharingRecipient } from '../types/api.ts'

import { RECIPIENT_TYPE_USER } from '../constants.ts'
import { isSvgIcon } from '../types/api.ts'
import { t } from './l10n.ts'

type OcsErrorResponse = {
	response?: { data?: { ocs?: { data?: unknown, meta?: { message?: string } } } }
}

/**
 * Extract the human-readable error message from a failed OCS request.
 * The real message lives in `ocs.data` (or `ocs.meta.message`); the axios
 * error itself only carries a generic "Request failed with status code …".
 *
 * @param error The caught error
 * @return The backend message, or a generic fallback
 */
export function getOcsErrorMessage(error: unknown): string {
	const ocs = (error as OcsErrorResponse)?.response?.data?.ocs
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
 * Converts a SharingRecipient from the sharing API into the NcSelectUsersModel
 * format expected by the NcSelectUsers component. User-type recipients rely on
 * NcSelectUsers' built-in avatar loading; other types get an inline SVG icon.
 *
 * @param recipient The recipient from the sharing API
 * @return An NcSelectUsersModel object suitable for use in the NcSelectUsers component
 */
export function recipientToNcSelectUsersModel(recipient: SharingRecipient): NcSelectUsersModel {
	const isUser = recipient.class === RECIPIENT_TYPE_USER
	const iconSvg = !isUser && recipient.icon
		? iconToInlineSvg(recipient.icon)
		: undefined

	return {
		id: recipient.value,
		displayName: recipient.display_name,
		user: recipient.value,
		subname: undefined,
		iconSvg,
		isNoUser: !isUser,
	}
}
