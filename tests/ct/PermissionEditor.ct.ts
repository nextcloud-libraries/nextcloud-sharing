/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { expect, test } from '@playwright/experimental-ct-vue'
import PermissionEditor from '../../lib/dialog/components/PermissionEditor.vue'

const baseProps = {
	presetOptions: [{ value: 'View', label: 'Can view' }, { value: 'custom', label: 'Can…' }],
	selectedPreset: { value: 'custom', label: 'Can…' },
	showPermissions: true,
	permissions: [
		{ class: 'read', source_class: null, display_name: 'Read', hint: null, priority: 0, presets: [], enabled: true, available: true },
		{ class: 'write', source_class: null, display_name: 'Write', hint: null, priority: 0, presets: [], enabled: false, available: false },
	],
}

test('shows the cap notice only when provided', async ({ mount }) => {
	const withNotice = await mount(PermissionEditor, { props: { ...baseProps, notice: 'Limited to Can view' } })
	await expect(withNotice).toContainText('Limited to Can view')

	const withoutNotice = await mount(PermissionEditor, { props: { ...baseProps, notice: null } })
	await expect(withoutNotice).not.toContainText('Limited to Can view')
})

test('renders a toggle per permission and disables those over the cap', async ({ mount }) => {
	const component = await mount(PermissionEditor, { props: baseProps })
	await expect(component.getByText('Read')).toBeVisible()
	await expect(component.getByText('Write')).toBeVisible()
	await expect(component.getByRole('switch', { name: 'Read' })).toBeEnabled()
	await expect(component.getByRole('switch', { name: 'Write' })).toBeDisabled()
})

test('hides the toggles when not in custom mode', async ({ mount }) => {
	const component = await mount(PermissionEditor, { props: { ...baseProps, showPermissions: false } })
	await expect(component.getByText('Read')).toBeHidden()
})
