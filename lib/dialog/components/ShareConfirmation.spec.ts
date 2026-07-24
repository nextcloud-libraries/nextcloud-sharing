/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import { shallowMount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ShareConfirmation from './ShareConfirmation.vue'

const LINK = 'https://cloud.example.com/s/abcdef'

/**
 * Mount the confirmation with the given props.
 *
 * @param props Component props
 */
function mountConfirmation(props: Record<string, unknown>) {
	return shallowMount(ShareConfirmation, {
		props: { link: LINK, isPublic: true, ...props },
		global: { renderStubDefaultSlot: true },
	})
}

describe('ShareConfirmation', () => {
	it('offers an optional QR code for a public link, hidden by default', async () => {
		const wrapper = mountConfirmation({ isPublic: true })
		// Hidden until toggled.
		expect(wrapper.find('.share-confirmation__qr').exists()).toBe(false)
		const toggle = wrapper.findComponent('.share-confirmation__qr-toggle')
		expect(toggle.exists()).toBe(true)

		toggle.vm.$emit('click')
		await wrapper.vm.$nextTick()

		const qr = wrapper.findComponent('.share-confirmation__qr')
		expect(qr.exists()).toBe(true)
		expect(qr.props('value')).toBe(LINK)
	})

	it('does not offer a QR code for a non-public share', () => {
		const wrapper = mountConfirmation({ isPublic: false })
		expect(wrapper.find('.share-confirmation__qr-toggle').exists()).toBe(false)
		expect(wrapper.find('.share-confirmation__qr').exists()).toBe(false)
	})

	it('presents the link in a readonly field', () => {
		const wrapper = mountConfirmation({ isPublic: true })
		const field = wrapper.findComponent({ name: 'NcTextField' })
		expect(field.props('modelValue')).toBe(LINK)
		expect(field.attributes('readonly')).toBeDefined()
	})

	it('shows no link field when there is no link', () => {
		const wrapper = mountConfirmation({ link: null, isPublic: true })
		expect(wrapper.findComponent({ name: 'NcTextField' }).exists()).toBe(false)
	})

	it('emits close when Done is clicked', () => {
		const wrapper = mountConfirmation({})
		wrapper.findComponent('.share-confirmation__done').vm.$emit('click')
		expect(wrapper.emitted('close')).toHaveLength(1)
	})
})
