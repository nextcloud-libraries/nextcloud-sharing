<!--
  SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
  SPDX-License-Identifier: GPL-3.0-or-later
-->
<template>
	<div :id="props.inputId || undefined" ref="root" class="property-field">
		<!-- Toggle property -->
		<NcFormBox v-if="property.type === 'boolean'">
			<NcFormBoxSwitch
				:label="property.display_name"
				:disabled="disabled"
				:modelValue="modelValue === 'true'"
				class="property-field__input-boolean"
				@update:modelValue="(value: boolean) => updateValue(value)" />
		</NcFormBox>

		<!-- Select property -->
		<NcSelect
			v-if="property.type === 'enum'"
			:clearable="!property.required"
			:disabled="disabled"
			:inputLabel="property.display_name"
			:loading="loading"
			:modelValue="modelValue"
			:multiple="false"
			:options="property.valid_values || []"
			:placeholder="property.hint || property.display_name"
			:required="property.required"
			class="property-field__input-enum"
			@update:modelValue="(value: string | number) => updateValue(String(value))" />

		<!-- String property (short or long) -->
		<template v-if="property.type === 'string'">
			<NcTextField
				v-if="(property.max_length || 0) <= 255"
				:disabled="disabled"
				:label="property.display_name"
				:loading="loading"
				:maxLength="property.max_length"
				:minLength="property.min_length"
				:modelValue="modelValue || ''"
				:placeholder="property.hint || property.display_name"
				:required="property.required"
				class="property-field__input-string"
				type="text"
				@update:modelValue="(value: string | number) => updateValue(String(value))" />

			<!-- String long property -->
			<NcTextArea
				v-else
				:disabled="disabled"
				:label="property.display_name"
				:loading="loading"
				:maxLength="property.max_length"
				:minLength="property.min_length"
				:modelValue="modelValue || ''"
				:placeholder="property.hint || property.display_name"
				:required="property.required"
				class="property-field__input-string"
				resize="vertical"
				type="text"
				@update:modelValue="(value) => updateValue(value)" />
		</template>

		<!-- Date property -->
		<NcDateTimePickerNative
			v-if="property.type === 'date'"
			:disabled="disabled || loading"
			:label="property.display_name"
			:min="parseISODate(property.min_date)"
			:max="parseISODate(property.max_date)"
			:modelValue="parseISODate(modelValue)"
			:required="property.required"
			class="property-field__input-date"
			type="datetime-local"
			@update:modelValue="(value: Date | null) => value && updateValue(value)" />

		<!-- Password property -->
		<NcPasswordField
			v-if="property.type === 'password'"
			:asText="modelValue === ''"
			:disabled="disabled"
			:label="property.display_name"
			:loading="loading"
			:modelValue="modelValue || ''"
			:placeholder="property.hint || property.display_name"
			:required="property.required"
			class="property-field__input-password"
			@update:modelValue="(value) => updateValue(value)" />

		<!-- Backend-provided hint, shown as a subtle note under the field -->
		<p v-if="property.hint" class="property-field__hint">
			<NcIconSvgWrapper :svg="IconInformationOutline" :size="16" />
			<span>{{ property.hint }}</span>
		</p>
	</div>
</template>

<script setup lang="ts">
import type { Share } from '../api/share.ts'
import type { SharingProperty } from '../types/api.ts'

import IconInformationOutline from '@mdi/svg/svg/information-outline.svg?raw'
import debounce from 'debounce'
import { nextTick, ref, useTemplateRef } from 'vue'
import NcDateTimePickerNative from '@nextcloud/vue/components/NcDateTimePickerNative'
import NcFormBox from '@nextcloud/vue/components/NcFormBox'
import NcFormBoxSwitch from '@nextcloud/vue/components/NcFormBoxSwitch'
import NcIconSvgWrapper from '@nextcloud/vue/components/NcIconSvgWrapper'
import NcPasswordField from '@nextcloud/vue/components/NcPasswordField'
import NcSelect from '@nextcloud/vue/components/NcSelect'
import NcTextArea from '@nextcloud/vue/components/NcTextArea'
import NcTextField from '@nextcloud/vue/components/NcTextField'
import { getOcsErrorMessage } from '../utils/api.ts'
import { logger } from '../utils/logger.ts'

const modelValue = defineModel<string | null>({ required: true, default: null })
const props = defineProps<{
	/** The share property rendered by this field */
	property: SharingProperty
	/** The share the property belongs to */
	share: Share
	/** Disabled state of the field */
	disabled?: boolean
	/** Id to set on the field wrapper, linked from an external toggle */
	inputId?: string
}>()

const loading = ref(false)
const root = useTemplateRef<HTMLElement>('root')

/**
 * The native control backing the current field, if any.
 */
function getControl(): HTMLInputElement | HTMLTextAreaElement | null {
	return root.value?.querySelector('input, textarea') ?? null
}

/**
 * Parse an ISO date string to a Date object.
 *
 * @param value The ISO date string or null
 * @return Date object or undefined
 */
function parseISODate(value: string | null | undefined): Date | undefined {
	if (!value) {
		return undefined
	}
	try {
		return new Date(value)
	} catch {
		return undefined
	}
}

const debouncedPersist = debounce(persistValue, 500)

/**
 * Update the local value immediately and schedule a debounced persist.
 * Converts component-native values (boolean, Date) to string for the API.
 *
 * @param value The new value from the input component
 */
function updateValue(value: boolean | string | Date | null) {
	if (value === null || value === undefined) {
		modelValue.value = null
	} else if (value instanceof Date) {
		// Backend expects an ISO 8601 (ATOM) string, e.g. 2026-07-16T13:01:02+00:00,
		// not the millisecond/"Z" form produced by Date.toISOString().
		modelValue.value = value.toISOString().replace(/\.\d{3}Z$/, '+00:00')
	} else {
		modelValue.value = value.toString()
	}

	// Clear a previous server-side rejection so the field is valid again while editing.
	getControl()?.setCustomValidity('')
	debouncedPersist()
}

/**
 * Show the native validity tooltip on a control. Focus first so the browser
 * actually renders the bubble even when the control lost focus (e.g. after
 * picking a date from the calendar popup).
 *
 * @param control The control to report validity on
 */
function reportValidity(control: HTMLInputElement | HTMLTextAreaElement) {
	control.focus()
	control.reportValidity()
}

/**
 * Persist the current value once typing settles. Skips the request when the
 * native input constraints (min/max length, required, …) are not satisfied,
 * and surfaces backend rejections through the same native validity tooltip.
 */
async function persistValue() {
	const control = getControl()
	if (control && !control.checkValidity()) {
		reportValidity(control)
		return
	}

	// An empty value disables (unsets) the property on the backend, while the
	// field itself stays editable so the user can type again.
	const value = modelValue.value === '' ? null : modelValue.value

	loading.value = true
	let error: unknown = null
	try {
		await props.share.setProperty(props.property.class, value)
	} catch (e) {
		error = e
	} finally {
		loading.value = false
	}

	if (!error) {
		logger.debug(`Property ${props.property.class} updated successfully`)
		return
	}

	logger.error(`Failed to update property ${props.property.class}:`, { error })
	// Surface the backend rejection through the native validity tooltip. Wait for
	// the loading state to settle and re-query the control, so the bubble is shown
	// on the element currently in the DOM rather than one detached by a re-render.
	await nextTick()
	const current = getControl()
	if (current) {
		current.setCustomValidity(getOcsErrorMessage(error))
		reportValidity(current)
	}
}

</script>

<style scoped lang="scss">
.property-field {
	position: relative;

	&__hint {
		display: flex;
		align-items: flex-start;
		gap: var(--default-grid-baseline);
		margin-block: calc(var(--default-grid-baseline) / 2) 0;
		padding-inline: var(--border-radius-element);
		color: var(--color-text-maxcontrast);
		font-size: var(--font-size-small, 13px);
		line-height: 1.4;

		// Keep the leading (i) icon aligned with the first line of the hint.
		:deep(.icon-vue) {
			flex: 0 0 auto;
			margin-block-start: 1px;
		}
	}
}
</style>
