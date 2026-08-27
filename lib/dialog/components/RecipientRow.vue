<!--
  SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
  SPDX-License-Identifier: GPL-3.0-or-later
-->
<template>
	<li class="recipient-row">
		<NcAvatar
			class="recipient-row__avatar"
			:size="32"
			:isNoUser="isNoUser"
			:user="isNoUser ? undefined : recipient.value"
			:displayName="recipient.display_name"
			disableMenu
			disableTooltip />

		<div class="recipient-row__desc">
			<span class="recipient-row__name">{{ recipient.display_name }}</span>
			<NcSelect
				class="recipient-row__preset"
				:modelValue="selectedPreset"
				:clearable="false"
				:searchable="false"
				:inputLabel="t('Permissions')"
				:hideLabel="true"
				:options="presetOptions"
				:placeholder="t('Can…')"
				@update:modelValue="onPresetChange" />
		</div>

		<NcActions class="recipient-row__actions" :aria-label="t('Recipient actions')">
			<NcActionButton @click="modalOpen = true">
				<template #icon>
					<NcIconSvgWrapper :svg="IconTune" :size="20" />
				</template>
				{{ t('Custom permissions') }}
			</NcActionButton>
			<NcActionButton @click="remove">
				<template #icon>
					<NcIconSvgWrapper :svg="IconDelete" :size="20" />
				</template>
				{{ t('Remove') }}
			</NcActionButton>
		</NcActions>

		<NcDialog
			v-if="modalOpen"
			:name="t('Permissions for {name}', { name: recipient.display_name })"
			size="small"
			@update:open="modalOpen = $event">
			<PermissionEditor
				class="recipient-row__editor"
				:presetOptions="presetOptions"
				:selectedPreset="selectedPreset"
				:showPermissions="showPermissions"
				:permissions="permissions"
				:permissionErrors="permissionErrors"
				:presetError="presetError"
				:notice="notice"
				:presetLabel="t('Permissions')"
				@presetChange="onPresetChange"
				@permissionToggle="onPermissionToggle" />
		</NcDialog>
	</li>
</template>

<script setup lang="ts">
import type { Share } from '../api/share.ts'
import type { SharingRecipient } from '../types/api.ts'

import IconDelete from '@mdi/svg/svg/delete.svg?raw'
import IconTune from '@mdi/svg/svg/tune-variant.svg?raw'
import { computed, ref } from 'vue'
import NcActionButton from '@nextcloud/vue/components/NcActionButton'
import NcActions from '@nextcloud/vue/components/NcActions'
import NcAvatar from '@nextcloud/vue/components/NcAvatar'
import NcDialog from '@nextcloud/vue/components/NcDialog'
import NcIconSvgWrapper from '@nextcloud/vue/components/NcIconSvgWrapper'
import NcSelect from '@nextcloud/vue/components/NcSelect'
import PermissionEditor from './PermissionEditor.vue'
import { useRecipientPermissions } from '../composables/useRecipientPermissions.ts'
import { RECIPIENT_TYPE_USER } from '../constants.ts'
import { t } from '../utils/l10n.ts'
import { logger } from '../utils/logger.ts'

const props = defineProps<{
	/** The share being edited */
	share: Share
	/** The recipient this row represents */
	recipient: SharingRecipient
}>()

const modalOpen = ref(false)

const isNoUser = computed(() => props.recipient.class !== RECIPIENT_TYPE_USER)

const {
	presetOptions,
	selectedPreset,
	showPermissions,
	permissions,
	notice,
	permissionErrors,
	presetError,
	onPresetChange,
	onPermissionToggle,
} = useRecipientPermissions(props.share, () => props.recipient)

/**
 * Remove this recipient from the share.
 */
async function remove() {
	try {
		await props.share.removeRecipient(props.recipient.class, props.recipient.value, props.recipient.instance ?? undefined)
	} catch (e) {
		logger.error('Failed to remove recipient', { error: e, recipient: props.recipient.value })
	}
}
</script>

<style scoped lang="scss">
.recipient-row {
	display: flex;
	align-items: center;
	gap: calc(var(--default-grid-baseline) * 2);
	min-height: 44px;

	&__desc {
		display: flex;
		flex-direction: column;
		flex: 1 1 auto;
		min-width: 0;
	}

	&__name {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	// Compact, borderless preset dropdown sitting under the name.
	&__preset {
		min-width: 0;
		:deep(.vs__dropdown-toggle) {
			border: none;
			color: var(--color-text-maxcontrast);
		}
	}

	&__actions {
		flex: 0 0 auto;
	}

	&__editor {
		margin-block: calc(var(--default-grid-baseline) * 2);
	}
}
</style>
