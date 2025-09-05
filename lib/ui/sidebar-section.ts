/*!
 * SPDX-FileCopyrightText: 2025 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import type { INode } from '@nextcloud/files'

export interface ISidebarSection {
	/**
	 * Unique identifier for the section
	 */
	id: string

	/**
	 * The registered identifier of the custom web component to be used.
	 *
	 * The custom elements identifier must be prefixed with your apps namespace like `oca_myapp-sharing_section`.
	 * Also the component must at least have a `node` property which must accept the current active node as `INode` from `@nextcloud/files`.
	 *
	 * @see https://developer.mozilla.org/en-US/docs/Web/API/Web_components
	 * @see https://vuejs.org/guide/extras/web-components#building-custom-elements-with-vue
	 */
	element: string

	/**
	 * Order of the sidebar sections.
	 * A higher value means the section will be displayed first.
	 */
	order: number

	/**
	 * Check if the section is enabled for the current active node
	 *
	 * @param node - The node to check
	 */
	enabled(node: INode): boolean
}

/**
 * Register a new sidebar section inside the files sharing sidebar tab.
 *
 * @param section - The section to register
 */
export function registerSidebarSection(section: ISidebarSection): void {
	if (!section.id) {
		throw new Error('Sidebar sections must have an id')
	}
	if (!section.element || !section.element.startsWith('oca_') || !window.customElements.get(section.element)) {
		throw new Error('Sidebar sections must provide a registered custom web component identifier')
	}
	if (typeof section.order !== 'number') {
		throw new Error('Sidebar sections must have the order property')
	}
	if (typeof section.enabled !== 'function') {
		throw new Error('Sidebar sections must implement the enabled method')
	}

	window._nc_files_sharing_sidebar_sections ??= new Map<string, ISidebarSection>()
	if (window._nc_files_sharing_sidebar_sections.has(section.id)) {
		throw new Error(`Sidebar section with id "${section.id}" is already registered`)
	}
	window._nc_files_sharing_sidebar_sections.set(section.id, section)
}

/**
 * Get all registered sidebar sections for the files sharing sidebar tab.
 */
export function getSidebarSections(): ISidebarSection[] {
	return [...(window._nc_files_sharing_sidebar_sections?.values() ?? [])]
}
