/*!
 * SPDX-FileCopyrightText: 2025 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import type { INode } from '@nextcloud/files'
import type { IShare } from '../index.ts'

import isSvg from 'is-svg'

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
	 * @param share - The share
	 * @param node - The node that share is about
	 */
	enabled(share: IShare, node: INode): boolean
}

export interface ISidebarInlineAction {
	/**
	 * Unique identifier for the action
	 */
	id: string

	/**
	 * Check if the action is enabled for a specific share type
	 *
	 * @param share - The share
	 * @param node - The node that share is about
	 */
	enabled(share: IShare, node: INode): boolean

	/**
	 * The callback handler when the user selected this action.
	 *
	 * @param share - The share
	 * @param node - The shared node
	 */
	exec(share: IShare, node: INode): void | Promise<void>

	/**
	 * The inline svg icon to use.
	 */
	iconSvg: string

	/**
	 * The localized label of this action
	 *
	 * @param share - The current share (might not be created yet)
	 * @param node - The shared node
	 */
	label(share: IShare, node: INode): string

	/**
	 * Order of the sidebar actions.
	 * A higher value means the action will be displayed first.
	 */
	order: number
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
 * Register a new sidebar action
 *
 * @param action - The action to register
 */
export function registerSidebarInlineAction(action: ISidebarInlineAction): void {
	if (!action.id) {
		throw new Error('Sidebar actions must have an id')
	}
	if (typeof action.order !== 'number') {
		throw new Error('Sidebar actions must have the "order" property')
	}
	if (typeof action.iconSvg !== 'string' || !isSvg(action.iconSvg)) {
		throw new Error('Sidebar actions must have the "iconSvg" property')
	}
	if (typeof action.label !== 'function') {
		throw new Error('Sidebar actions must implement the "label" method')
	}
	if (typeof action.exec !== 'function') {
		throw new Error('Sidebar actions must implement the "exec" method')
	}
	if (typeof action.enabled !== 'function') {
		throw new Error('Sidebar actions must implement the "enabled" method')
	}
	window._nc_files_sharing_sidebar_inline_actions ??= new Map<string, ISidebarInlineAction>()

	if (window._nc_files_sharing_sidebar_inline_actions.has(action.id)) {
		throw new Error(`Sidebar action with id "${action.id}" is already registered`)
	}
	window._nc_files_sharing_sidebar_inline_actions.set(action.id, action)
}

/**
 * Get all registered sidebar actions
 */
export function getSidebarActions(): ISidebarAction[] {
	return [...(window._nc_files_sharing_sidebar_actions?.values() ?? [])]
}

/**
 * Get all registered sidebar inline actions
 */
export function getSidebarInlineActions(): ISidebarInlineAction[] {
	return [...(window._nc_files_sharing_sidebar_inline_actions?.values() ?? [])]
}
