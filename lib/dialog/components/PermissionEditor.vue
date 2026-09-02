<!--
  SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
  SPDX-License-Identifier: GPL-3.0-or-later
-->
<template>
	<div class="permission-editor">
		<!-- Cap notice: shown when some permissions are not grantable -->
		<NcNoteCard v-if="notice" type="info">
			{{ notice }}
		</NcNoteCard>

		<NcSelect
			:modelValue="selectedPreset"
			:clearable="false"
			:searchable="false"
			:inputLabel="presetLabel"
			:hideLabel="hideLabel"
			:options="presetOptions"
			class="permission-editor__preset"
			:placeholder="t('Custom permissions')"
			@update:modelValue="(option) => emit('presetChange', option)" />

		<!-- Fine-grained toggles, shown while the custom entry is selected -->
		<Transition name="expand">
			<div v-if="showPermissions" ref="permissionsEl" class="permission-editor__permissions">
				<div class="permission-editor__permissions-inner">
					<NcFormBox>
						<NcFormBoxSwitch
							v-for="permission in permissions"
							:key="permission.class"
							:label="permission.display_name"
							:description="permission.hint ?? undefined"
							:disabled="permission.available === false"
							:error="permissionErrors[permission.class]"
							:modelValue="permission.enabled"
							@update:modelValue="(enabled) => emit('permissionToggle', permission, enabled)" />
					</NcFormBox>
				</div>
			</div>
		</Transition>

		<NcNoteCard v-if="presetError" type="error">
			{{ presetError }}
		</NcNoteCard>
	</div>
</template>

<script setup lang="ts">
import type { PresetOption } from '../composables/useRecipientPermissions.ts'
import type { SharingPermission } from '../types/api.ts'

import { nextTick, ref, watch } from 'vue'
import NcFormBox from '@nextcloud/vue/components/NcFormBox'
import NcFormBoxSwitch from '@nextcloud/vue/components/NcFormBoxSwitch'
import NcNoteCard from '@nextcloud/vue/components/NcNoteCard'
import NcSelect from '@nextcloud/vue/components/NcSelect'
import { t } from '../utils/l10n.ts'

/** A permission toggle; `available === false` disables it (over the cap). */
export type EditablePermission = SharingPermission & { available?: boolean }

const props = withDefaults(defineProps<{
	/** Preset dropdown options */
	presetOptions: PresetOption[]
	/** The currently selected preset option */
	selectedPreset: PresetOption | null
	/** Whether the fine-grained toggles are shown (custom preset) */
	showPermissions: boolean
	/** The permission toggles */
	permissions: EditablePermission[]
	/** Backend errors per permission class */
	permissionErrors?: Record<string, string>
	/** Backend error for the preset selection */
	presetError?: string | null
	/** Info notice shown above the editor (e.g. the permission cap) */
	notice?: string | null
	/** Label for the preset select */
	presetLabel?: string
	/** Hide the preset select label */
	hideLabel?: boolean
}>(), {
	permissionErrors: () => ({}),
	presetError: null,
	notice: null,
	presetLabel: undefined,
	hideLabel: false,
})

const emit = defineEmits<{
	(e: 'presetChange', option: PresetOption | null): void
	(e: 'permissionToggle', permission: SharingPermission, enabled: boolean): void
}>()

const permissionsEl = ref<HTMLElement | null>(null)

// Reveal the toggles once they appear, they are below the fold in the dialog.
watch(() => props.showPermissions, async (shown) => {
	if (!shown) {
		return
	}
	await nextTick()
	permissionsEl.value?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
})
</script>

<style scoped lang="scss">
.permission-editor {
	display: flex;
	flex-direction: column;
	gap: calc(var(--default-grid-baseline) * 3);

	&__permissions {
		display: grid;
		grid-template-rows: 1fr;
	}

	&__permissions-inner {
		overflow: hidden;
	}
}

.expand-enter-active,
.expand-leave-active {
	transition: grid-template-rows 0.2s ease-in-out;
}

.expand-enter-from,
.expand-leave-to {
	grid-template-rows: 0fr;
}

@media (prefers-reduced-motion: reduce) {
	.expand-enter-active,
	.expand-leave-active {
		transition: none;
	}
}
</style>
