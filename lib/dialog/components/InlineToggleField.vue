<!--
  SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
  SPDX-License-Identifier: GPL-3.0-or-later
-->
<template>
	<div
		class="inline-toggle-field"
		role="group"
		:aria-label="label">
		<!-- Input slot: inputId must be applied to the controlled input by the consumer -->
		<!-- Clicking the disabled slot enables the toggle -->
		<div
			ref="slotContainer"
			class="inline-toggle-field__slot"
			:class="{ 'inline-toggle-field__slot--inactive': !isEnabled }"
			@click="!isEnabled && onToggleEnabled(true)">
			<slot :inputId="inputId" />
		</div>

		<!-- Floating toggle positioned over the input -->
		<NcCheckboxRadioSwitch
			:modelValue="isEnabled"
			:aria-controls="inputId"
			:aria-label="label"
			class="inline-toggle-field__toggle"
			:class="{ 'inline-toggle-field__toggle--long-text': longText }"
			type="switch"
			@update:modelValue="onToggleEnabled" />
	</div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import NcCheckboxRadioSwitch from '@nextcloud/vue/components/NcCheckboxRadioSwitch'

/** Whether the field is enabled */
const modelValue = defineModel<boolean>({ default: false })

defineProps<{
	/** Accessible label of the field group and its toggle */
	label: string
	/** Align the toggle to the first line of a multi-line field (e.g. textarea) */
	longText?: boolean
}>()

const inputId = `property-input-${Math.random().toString(36).slice(2, 9)}`
const isEnabled = computed(() => modelValue.value === true)
const slotContainer = ref(null as HTMLDivElement | null)

/**
 * Handle toggle state change — focus the first input after enabling
 *
 * @param enabled Whether the property is enabled
 */
async function onToggleEnabled(enabled: boolean) {
	modelValue.value = enabled
	if (enabled) {
		// Wait for the disabled state to be removed, then focus the first input
		await nextTick()
		const focusable = slotContainer.value?.querySelector('input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([disabled]):not([tabindex="-1"])') as HTMLElement | null
		focusable?.focus()
	}
}
</script>

<style scoped lang="scss">
.inline-toggle-field {
	position: relative;
	display: flex;
	align-items: center;
	gap: var(--default-grid-baseline);

	&__slot {
		flex: 1 1 100%;
		width: 100%;

		&--inactive {
			cursor: pointer;

			// Let the click reach the slot container (to enable the field) instead
			// of being swallowed by the disabled input inside it.
			> * {
				pointer-events: none;
			}
		}
	}

	&__toggle {
		height: var(--default-clickable-area);

		&--long-text {
			align-self: flex-start;
			margin-top: 6px;
		}
	}
}
</style>
