import type { VueWrapper } from '@vue/test-utils'
/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import type { SharingProperty } from '../types/api.ts'

import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import PropertyField from './PropertyField.vue'
import { updateShareProperty } from '../api/sharing.ts'

vi.mock('../api/sharing.ts', () => ({
	updateShareProperty: vi.fn().mockResolvedValue({}),
}))

const mockedUpdate = vi.mocked(updateShareProperty)

const PROPERTY_CLASS = 'OCP\\Sharing\\Property\\LabelSharePropertyType'

function property(overrides: Partial<SharingProperty> = {}): SharingProperty {
	return {
		class: PROPERTY_CLASS,
		display_name: 'Label',
		hint: null,
		priority: 0,
		required: false,
		value: null,
		type: 'string',
		min_length: 3,
		max_length: 64,
		...overrides,
	}
}

function mountField(overrides: Partial<SharingProperty> = {}): VueWrapper {
	return mount(PropertyField, {
		props: { property: property(overrides), share: { id: '42' } },
		attachTo: document.body,
	})
}

/**
 * Build an axios-like OCS error carrying a backend message.
 *
 * @param message The OCS `data` message
 */
function ocsError(message: string) {
	return { response: { data: { ocs: { data: message, meta: { message: '' } } } } }
}

beforeEach(() => {
	vi.useFakeTimers()
	mockedUpdate.mockClear()
	mockedUpdate.mockResolvedValue({} as never)
})

afterEach(() => {
	vi.useRealTimers()
})

describe('PropertyField rendering', () => {
	it('renders a text field for a short string property', () => {
		const wrapper = mountField({ max_length: 64 })
		expect(wrapper.find('input[type="text"]').exists()).toBe(true)
		expect(wrapper.find('textarea').exists()).toBe(false)
	})

	it('renders a textarea for a long string property', () => {
		const wrapper = mountField({ max_length: 500 })
		expect(wrapper.find('textarea').exists()).toBe(true)
	})

	it('renders a switch for a boolean property', () => {
		const wrapper = mountField({ type: 'boolean', min_length: null, max_length: null })
		// TODO: assert on input[role="switch"] once @nextcloud/vue > 9.9.0 is released
		expect(wrapper.find('.property-field__input-boolean input[type="checkbox"]').exists()).toBe(true)
	})

	it('renders a date input for a date property', () => {
		const wrapper = mountField({ type: 'date', min_length: null, max_length: null })
		expect(wrapper.find('input[type="date"]').exists()).toBe(true)
	})

	it('renders a password field for a password property', () => {
		const wrapper = mountField({ type: 'password', min_length: null, max_length: null })
		expect(wrapper.find('.property-field__input-password input').exists()).toBe(true)
	})

	it('applies native constraint attributes from the property', () => {
		const wrapper = mountField({ required: true, min_length: 3, max_length: 64 })
		const input = wrapper.find('input[type="text"]').element as HTMLInputElement
		expect(input.required).toBe(true)
		expect(input.minLength).toBe(3)
		expect(input.maxLength).toBe(64)
	})
})

describe('PropertyField persistence', () => {
	it('does not dispatch before the debounce elapses', async () => {
		const wrapper = mountField()
		const input = wrapper.find('input[type="text"]')
		vi.spyOn(input.element as HTMLInputElement, 'checkValidity').mockReturnValue(true)

		await input.setValue('Hello')
		expect(mockedUpdate).not.toHaveBeenCalled()
	})

	it('dispatches once after typing settles', async () => {
		const wrapper = mountField()
		const input = wrapper.find('input[type="text"]')
		vi.spyOn(input.element as HTMLInputElement, 'checkValidity').mockReturnValue(true)

		await input.setValue('Hello')
		await vi.advanceTimersByTimeAsync(500)

		expect(mockedUpdate).toHaveBeenCalledTimes(1)
		expect(mockedUpdate).toHaveBeenCalledWith('42', PROPERTY_CLASS, 'Hello')
	})

	it('debounces rapid edits into a single dispatch with the latest value', async () => {
		const wrapper = mountField()
		const input = wrapper.find('input[type="text"]')
		vi.spyOn(input.element as HTMLInputElement, 'checkValidity').mockReturnValue(true)

		await input.setValue('H')
		await input.setValue('He')
		await input.setValue('Hey')
		await vi.advanceTimersByTimeAsync(500)

		expect(mockedUpdate).toHaveBeenCalledTimes(1)
		expect(mockedUpdate).toHaveBeenCalledWith('42', PROPERTY_CLASS, 'Hey')
	})

	it('skips the request and reports validity when the input is invalid', async () => {
		const wrapper = mountField()
		const input = wrapper.find('input[type="text"]')
		const el = input.element as HTMLInputElement
		vi.spyOn(el, 'checkValidity').mockReturnValue(false)
		const reportValidity = vi.spyOn(el, 'reportValidity').mockReturnValue(false)

		await input.setValue('He')
		await vi.advanceTimersByTimeAsync(500)

		expect(mockedUpdate).not.toHaveBeenCalled()
		expect(reportValidity).toHaveBeenCalled()
	})

	it('surfaces a backend rejection via setCustomValidity, not a thrown error', async () => {
		const wrapper = mountField()
		const input = wrapper.find('input[type="text"]')
		const el = input.element as HTMLInputElement
		vi.spyOn(el, 'checkValidity').mockReturnValue(true)
		const setCustomValidity = vi.spyOn(el, 'setCustomValidity')
		const reportValidity = vi.spyOn(el, 'reportValidity').mockReturnValue(false)
		mockedUpdate.mockRejectedValueOnce(ocsError('Need at least 3 characters: He'))

		await input.setValue('Hey')
		await vi.advanceTimersByTimeAsync(500)

		expect(setCustomValidity).toHaveBeenCalledWith('Need at least 3 characters: He')
		expect(reportValidity).toHaveBeenCalled()
	})

	it('clears a previous custom validity on the next edit', async () => {
		const wrapper = mountField()
		const input = wrapper.find('input[type="text"]')
		const el = input.element as HTMLInputElement
		vi.spyOn(el, 'checkValidity').mockReturnValue(true)
		const setCustomValidity = vi.spyOn(el, 'setCustomValidity')

		await input.setValue('Hey')
		expect(setCustomValidity).toHaveBeenCalledWith('')
	})

	it('persists an empty optional value as null to unset it', async () => {
		const wrapper = mountField({ required: false })
		const input = wrapper.find('input[type="text"]')
		vi.spyOn(input.element as HTMLInputElement, 'checkValidity').mockReturnValue(true)

		await input.setValue('Hello')
		await input.setValue('')
		await vi.advanceTimersByTimeAsync(500)

		expect(mockedUpdate).toHaveBeenCalledTimes(1)
		expect(mockedUpdate).toHaveBeenCalledWith('42', PROPERTY_CLASS, null)
	})

	it('dispatches string booleans for a boolean property', async () => {
		const wrapper = mountField({ type: 'boolean', min_length: null, max_length: null })
		const checkbox = wrapper.find('input[type="checkbox"]')
		vi.spyOn(checkbox.element as HTMLInputElement, 'checkValidity').mockReturnValue(true)

		await checkbox.setValue(true)
		await vi.advanceTimersByTimeAsync(500)

		expect(mockedUpdate).toHaveBeenCalledWith('42', PROPERTY_CLASS, 'true')
	})
})
