/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import type { VueWrapper } from '@vue/test-utils'

import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { h, nextTick } from 'vue'
import InlineToggleField from './InlineToggleField.vue'

const INACTIVE = '.inline-toggle-field__slot--inactive'
const SLOT = '.inline-toggle-field__slot'
const TOGGLE_INPUT = '.inline-toggle-field__toggle input'

/**
 * Mount with a focusable input in the default slot.
 *
 * @param props Component props
 */
function mountField(props: { modelValue: boolean, label?: string, longText?: boolean }): VueWrapper {
	return mount(InlineToggleField, {
		props: { label: 'Note', ...props },
		slots: {
			default: (slotProps: { inputId: string }) => h('input', { id: slotProps.inputId, class: 'slot-input' }),
		},
		attachTo: document.body,
	})
}

describe('InlineToggleField', () => {
	it('renders the slot content and the toggle switch', () => {
		const wrapper = mountField({ modelValue: true })
		expect(wrapper.find('.slot-input').exists()).toBe(true)
		expect(wrapper.find(TOGGLE_INPUT).exists()).toBe(true)
	})

	it('marks the slot inactive when disabled', () => {
		const wrapper = mountField({ modelValue: false })
		expect(wrapper.find(INACTIVE).exists()).toBe(true)
	})

	it('does not mark the slot inactive when enabled', () => {
		const wrapper = mountField({ modelValue: true })
		expect(wrapper.find(INACTIVE).exists()).toBe(false)
	})

	it('emits update:modelValue(true) when toggled on', async () => {
		const wrapper = mountField({ modelValue: false })
		await wrapper.find(TOGGLE_INPUT).setValue(true)
		expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([true])
	})

	it('emits update:modelValue(false) when toggled off', async () => {
		const wrapper = mountField({ modelValue: true })
		await wrapper.find(TOGGLE_INPUT).setValue(false)
		expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false])
	})

	it('enables by clicking the inactive slot', async () => {
		const wrapper = mountField({ modelValue: false })
		await wrapper.find(SLOT).trigger('click')
		expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([true])
	})

	it('does not emit when clicking the active slot', async () => {
		const wrapper = mountField({ modelValue: true })
		await wrapper.find(SLOT).trigger('click')
		expect(wrapper.emitted('update:modelValue')).toBeUndefined()
	})

	it('focuses the first focusable slot element after enabling', async () => {
		const wrapper = mountField({ modelValue: false })
		await wrapper.find(TOGGLE_INPUT).setValue(true)
		await nextTick()
		expect(document.activeElement).toBe(wrapper.find('.slot-input').element)
	})

	it('does not throw when enabling with no focusable slot element', async () => {
		const wrapper = mount(InlineToggleField, {
			props: { label: 'Note', modelValue: false },
			slots: { default: () => h('span', 'just text') },
			attachTo: document.body,
		})
		await expect(wrapper.find(TOGGLE_INPUT).setValue(true)).resolves.not.toThrow()
	})

	it('adds the long-text class on the toggle when longText is set', () => {
		const wrapper = mountField({ modelValue: true, longText: true })
		expect(wrapper.find('.inline-toggle-field__toggle--long-text').exists()).toBe(true)
	})

	it('exposes the group aria-label and wires the slot input id', () => {
		const wrapper = mountField({ modelValue: true, label: 'Expiration' })
		expect(wrapper.find('[role="group"]').attributes('aria-label')).toBe('Expiration')
		const slotId = wrapper.find('.slot-input').attributes('id')
		expect(slotId).toBeTruthy()
		expect(wrapper.find(TOGGLE_INPUT).attributes('aria-controls')).toBe(slotId)
	})
})
