/**
 * SPDX-FileCopyrightText: 2025 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 * @vitest-environment happy-dom
 */

import type { ISidebarInlineAction } from '../../lib/ui/index.ts'

import { beforeEach, describe, expect, test, vi } from 'vitest'
import { getSidebarInlineActions, registerSidebarInlineAction } from '../../lib/ui/index.ts'

describe('sidebar inline action', () => {
	beforeEach(() => {
		delete window._nc_files_sharing_sidebar_inline_actions
	})

	test('register action', async () => {
		registerSidebarInlineAction(createAction())
		expect(window._nc_files_sharing_sidebar_inline_actions).toHaveLength(1)
	})

	test('register multiple actions', async () => {
		registerSidebarInlineAction(createAction())
		registerSidebarInlineAction({ ...createAction(), id: 'test-2' })
		expect(window._nc_files_sharing_sidebar_inline_actions).toHaveLength(2)
	})

	test('get registered actions', async () => {
		registerSidebarInlineAction(createAction())
		registerSidebarInlineAction({ ...createAction(), id: 'test-2' })
		expect(getSidebarInlineActions()).toHaveLength(2)
		expect(getSidebarInlineActions().map(({ id }) => id)).toEqual(['test', 'test-2'])
	})

	test('register same action twice', async () => {
		registerSidebarInlineAction(createAction())
		expect(() => registerSidebarInlineAction(createAction())).toThrowErrorMatchingInlineSnapshot('[Error: Sidebar action with id "test" is already registered]')
	})

	test('register action with missing id', async () => {
		expect(() => registerSidebarInlineAction({
			...createAction(),
			id: '',
		})).toThrowErrorMatchingInlineSnapshot('[Error: Sidebar actions must have an id]')
	})

	test.for`
	method
	--
	${'enabled'}
	${'label'}
	${'exec'}
	`('register action with missing $method', async ({ method }) => {
		const action = createAction()
		// @ts-expect-error mocking for tests
		delete action[method]

		expect(() => registerSidebarInlineAction(action)).toThrowError()
	})

	test('register action with invalid icon', async () => {
		expect(() => registerSidebarInlineAction({
			...createAction(),
			iconSvg: '<div></div>',
		})).toThrowErrorMatchingInlineSnapshot('[Error: Sidebar actions must have the "iconSvg" property]')
	})
})

function createAction(): ISidebarInlineAction {
	return {
		id: 'test',
		order: 0,
		iconSvg: '<svg></svg>',
		enabled: vi.fn(),
		label: vi.fn(),
		exec: vi.fn(),
	}
}
