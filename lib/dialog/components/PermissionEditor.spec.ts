/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import type { EditablePermission } from './PermissionEditor.vue'

import { shallowMount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import PermissionEditor from './PermissionEditor.vue'

vi.mock('../utils/l10n.ts', () => ({ t: (s: string) => s }))

function permission(cls: string, enabled: boolean, available: boolean): EditablePermission {
	return { class: cls, source_class: null, display_name: cls, hint: null, priority: 0, presets: [], enabled, available }
}

function mountEditor(props: Record<string, unknown> = {}) {
	return shallowMount(PermissionEditor, {
		props: {
			presetOptions: [{ value: 'View', label: 'Can view' }, { value: 'custom', label: 'Can…' }],
			selectedPreset: { value: 'custom', label: 'Can…' },
			showPermissions: true,
			permissions: [permission('read', true, true), permission('write', false, false)],
			...props,
		},
		global: { renderStubDefaultSlot: true },
	})
}

describe('PermissionEditor', () => {
	it('shows the notice only when provided', () => {
		expect(mountEditor({ notice: null }).findComponent({ name: 'NcNoteCard' }).exists()).toBe(false)
		expect(mountEditor({ notice: 'Capped' }).text()).toContain('Capped')
	})

	it('emits presetChange from the select', () => {
		const wrapper = mountEditor()
		wrapper.findComponent({ name: 'NcSelect' }).vm.$emit('update:modelValue', { value: 'View', label: 'Can view' })
		expect(wrapper.emitted('presetChange')![0]).toEqual([{ value: 'View', label: 'Can view' }])
	})

	it('renders a toggle per permission and disables those over the cap', () => {
		const wrapper = mountEditor()
		const toggles = wrapper.findAllComponents({ name: 'NcFormBoxSwitch' })
		expect(toggles).toHaveLength(2)
		expect(toggles[0].props('disabled')).toBe(false)
		expect(toggles[1].props('disabled')).toBe(true)
	})

	it('hides toggles when not in custom mode', () => {
		const wrapper = mountEditor({ showPermissions: false })
		expect(wrapper.findComponent({ name: 'NcFormBoxSwitch' }).exists()).toBe(false)
	})

	it('emits permissionToggle from a switch', () => {
		const wrapper = mountEditor()
		wrapper.findAllComponents({ name: 'NcFormBoxSwitch' })[0].vm.$emit('update:modelValue', false)
		const emitted = wrapper.emitted('permissionToggle')![0]
		expect((emitted[0] as { class: string }).class).toBe('read')
		expect(emitted[1]).toBe(false)
	})
})
