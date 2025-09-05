/**
 * SPDX-FileCopyrightText: 2025 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 * @vitest-environment happy-dom
 */

import type { ISidebarAction } from '../../lib/ui/index.ts'

import { beforeEach, describe, expect, test, vi } from 'vitest'
import { getSidebarActions, registerSidebarAction } from '../../lib/ui/index.ts'

describe('sidebar action', () => {
	const elementsSpy = vi.spyOn(window.customElements, 'get')

	beforeEach(() => {
		vi.resetAllMocks()
		elementsSpy.mockImplementation((id: string) => id.startsWith('oca_myapp') ? class extends HTMLElement {} : undefined)
		delete window._nc_files_sharing_sidebar_actions
	})

	test('register action', async () => {
		registerSidebarAction(createAction())
		expect(window._nc_files_sharing_sidebar_actions).toHaveLength(1)
		expect(elementsSpy).toHaveBeenCalledOnce()
	})

	test('register multiple actions', async () => {
		registerSidebarAction(createAction())
		registerSidebarAction({ ...createAction(), id: 'test-2' })
		expect(window._nc_files_sharing_sidebar_actions).toHaveLength(2)
		expect(elementsSpy).toHaveBeenCalledTimes(2)
	})

	test('get registered actions', async () => {
		registerSidebarAction(createAction())
		registerSidebarAction({ ...createAction(), id: 'test-2' })
		expect(getSidebarActions()).toHaveLength(2)
		expect(getSidebarActions().map(({ id }) => id)).toEqual(['test', 'test-2'])
	})

	test('register same action twice', async () => {
		registerSidebarAction(createAction())
		expect(() => registerSidebarAction(createAction())).toThrowErrorMatchingInlineSnapshot('[Error: Sidebar action with id "test" is already registered]')
	})

	test('register action with missing id', async () => {
		expect(() => registerSidebarAction({
			...createAction(),
			id: '',
		})).toThrowErrorMatchingInlineSnapshot('[Error: Sidebar actions must have an id]')
	})

	test('register action with missing enabled', async () => {
		const action = createAction()
		// @ts-expect-error mocking for tests
		delete action.enabled

		expect(() => registerSidebarAction(action)).toThrowErrorMatchingInlineSnapshot('[Error: Sidebar actions must implement the "enabled" method]')
	})

	test('register action with invalid element', async () => {
		const action = createAction()
		action.element = 'invalid-element'

		expect(() => registerSidebarAction(action)).toThrowErrorMatchingInlineSnapshot('[Error: Sidebar actions must provide a registered custom web component identifier]')
	})

	test('register action with unregistered element', async () => {
		const action = createAction()
		action.element = 'oca_non_existent_element'

		expect(() => registerSidebarAction(action)).toThrowErrorMatchingInlineSnapshot('[Error: Sidebar actions must provide a registered custom web component identifier]')
	})
})

function createAction(): ISidebarAction {
	return {
		id: 'test',
		order: 0,
		element: 'oca_myapp-sharing_action',
		enabled: vi.fn(),
	}
}
