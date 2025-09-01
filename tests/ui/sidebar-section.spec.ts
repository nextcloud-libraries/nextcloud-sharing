/**
 * SPDX-FileCopyrightText: 2025 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 * @vitest-environment happy-dom
 */

import type { ISidebarSection } from '../../lib/ui/index.ts'

import { beforeEach, describe, expect, test, vi } from 'vitest'
import { getSidebarSections, registerSidebarSection } from '../../lib/ui/index.ts'

describe('sidebar section', () => {
	const elementsSpy = vi.spyOn(window.customElements, 'get')

	beforeEach(() => {
		vi.resetAllMocks()
		elementsSpy.mockImplementation((id: string) => id.startsWith('oca_myapp') ? class extends HTMLElement {} : undefined)
		delete window._nc_files_sharing_sidebar_sections
	})

	test('register section', async () => {
		registerSidebarSection(createSection())
		expect(window._nc_files_sharing_sidebar_sections).toHaveLength(1)
		expect(elementsSpy).toHaveBeenCalledOnce()
	})

	test('register multiple sections', async () => {
		registerSidebarSection(createSection())
		registerSidebarSection({ ...createSection(), id: 'test-2' })
		expect(window._nc_files_sharing_sidebar_sections).toHaveLength(2)
		expect(elementsSpy).toHaveBeenCalledTimes(2)
	})

	test('get registered sections', async () => {
		registerSidebarSection(createSection())
		registerSidebarSection({ ...createSection(), id: 'test-2' })
		expect(getSidebarSections()).toHaveLength(2)
		expect(getSidebarSections().map(({ id }) => id)).toEqual(['test', 'test-2'])
	})

	test('register same section twice', async () => {
		registerSidebarSection(createSection())
		expect(() => registerSidebarSection(createSection())).toThrowErrorMatchingInlineSnapshot('[Error: Sidebar section with id "test" is already registered]')
	})

	test('register section with missing id', async () => {
		expect(() => registerSidebarSection({
			...createSection(),
			id: '',
		})).toThrowErrorMatchingInlineSnapshot('[Error: Sidebar sections must have an id]')
	})

	test('register section with missing enabled', async () => {
		const section = createSection()
		// @ts-expect-error mocking for tests
		delete section.enabled

		expect(() => registerSidebarSection(section)).toThrowErrorMatchingInlineSnapshot('[Error: Sidebar sections must implement the enabled method]')
	})

	test('register section with invalid element', async () => {
		const section = createSection()
		section.element = 'invalid-element'

		expect(() => registerSidebarSection(section)).toThrowErrorMatchingInlineSnapshot('[Error: Sidebar sections must provide a registered custom web component identifier]')
	})

	test('register section with unregistered element', async () => {
		const section = createSection()
		section.element = 'oca_non_existent_element'

		expect(() => registerSidebarSection(section)).toThrowErrorMatchingInlineSnapshot('[Error: Sidebar sections must provide a registered custom web component identifier]')
	})
})

function createSection(): ISidebarSection {
	return {
		id: 'test',
		order: 0,
		element: 'oca_myapp-sharing_section',
		enabled: vi.fn(),
	}
}
