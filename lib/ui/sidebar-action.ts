/*!
 * SPDX-FileCopyrightText: 2025 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import type { INode } from '@nextcloud/files'
import type { IShare, ShareType } from '../index.ts'

export interface ISidebarActionContext {
	/**
	 * The node that should be shared
	 */
	node: INode

	/**
	 * The type of the share (to be created)
	 */
	shareType: ShareType

	/**
	 * The share model if the share already exists
	 */
	share?: IShare
}

export interface ISidebarAction {
	/**
	 * Unique identifier for the action
	 */
	id: string

	/**
	 * The registered identifier of the custom web component to be used.
	 *
	 * The custom elements identifier must be prefixed with your apps namespace like `oca_myapp-sharing_action`.
	 * Also the component must implement following properties:
	 * - `node`: The shared node as `INode` from `@nextcloud/files`.
	 * - `shareType`: The type of the share as number, see `ShareType` for potential values.
	 * - `share`: The share model if the share already exists as object of type `IShare` (potentially undefined).
	 * - `onSave`: A registration method to register a on-save callback which will be called when the share is saved `(callback: () => Promise<void>) => void`
	 *
	 * @see https://developer.mozilla.org/en-US/docs/Web/API/Web_components
	 * @see https://vuejs.org/guide/extras/web-components#building-custom-elements-with-vue
	 */
	element: string

	/**
	 * Order of the sidebar actions.
	 * A higher value means the action will be displayed first.
	 */
	order: number

	/**
	 * Check if the action is enabled for a specific share type
	 *
	 * @param shareType - The share type to check
	 * @param context - If the share already exists the current share context is passed
	 */
	enabled(shareType: ShareType, context: ISidebarActionContext): boolean
}

/**
 * Register a new sidebar action
 *
 * @param action - The action to register
 */
export function registerSidebarAction(action: ISidebarAction): void {
	if (!action.id) {
		throw new Error('Sidebar actions must have an id')
	}
	if (!action.element || !action.element.startsWith('oca_') || !window.customElements.get(action.element)) {
		throw new Error('Sidebar actions must provide a registered custom web component identifier')
	}
	if (typeof action.order !== 'number') {
		throw new Error('Sidebar actions must have the order property')
	}
	if (typeof action.enabled !== 'function') {
		throw new Error('Sidebar actions must implement the "enabled" method')
	}
	window._nc_files_sharing_sidebar_actions ??= new Map<string, ISidebarAction>()

	if (window._nc_files_sharing_sidebar_actions.has(action.id)) {
		throw new Error(`Sidebar action with id "${action.id}" is already registered`)
	}
	window._nc_files_sharing_sidebar_actions.set(action.id, action)
}

/**
 * Get all registered sidebar actions
 */
export function getSidebarActions(): ISidebarAction[] {
	return [...(window._nc_files_sharing_sidebar_actions?.values() ?? [])]
}
