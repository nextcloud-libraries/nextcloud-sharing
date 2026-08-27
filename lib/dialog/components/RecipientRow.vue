<!--
  SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
  SPDX-License-Identifier: GPL-3.0-or-later
-->
<template>
	<li class="recipient-row">
		<div class="recipient-row__header">
			<NcAvatar
				class="recipient-row__avatar"
				:size="32"
				:isNoUser="isNoUser"
				:user="isNoUser ? undefined : recipient.value"
				:displayName="recipient.display_name"
				disableMenu
				disableTooltip />
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
				@update:modelValue="(option) => onRecipientPresetChange(recipient, option)" />
			<NcButton
				class="recipient-row__remove"
				variant="tertiary"
				:aria-label="t('Remove recipient')"
				@click="remove">
				<template #icon>
					<NcIconSvgWrapper :svg="IconClose" :size="20" />
				</template>
			</NcButton>
		</div>

		<Transition name="expand">
			<div v-if="showPermissions" class="recipient-row__permissions">
				<div class="recipient-row__permissions-inner">
					<NcFormBox>
						<NcFormBoxSwitch
							v-for="permission in permissions"
							:key="permission.class"
							:label="permission.display_name"
							:description="permission.hint ?? undefined"
							:disabled="!permission.available"
							:error="errors[permission.class]"
							:modelValue="permission.enabled"
							@update:modelValue="(enabled) => onRecipientPermissionToggle(recipient, permission, enabled)" />
					</NcFormBox>
				</div>
			</div>
		</Transition>

		<NcNoteCard v-if="presetError" type="error">
			{{ presetError }}
		</NcNoteCard>
	</li>
</template>

<script setup lang="ts">
import type { Share } from '../api/share.ts'
import type { PresetOption } from '../composables/useRecipientPermissions.ts'
import type { SharingRecipient } from '../types/api.ts'

import IconClose from '@mdi/svg/svg/close.svg?raw'
import { computed } from 'vue'
import NcAvatar from '@nextcloud/vue/components/NcAvatar'
import NcButton from '@nextcloud/vue/components/NcButton'
import NcFormBox from '@nextcloud/vue/components/NcFormBox'
import NcFormBoxSwitch from '@nextcloud/vue/components/NcFormBoxSwitch'
import NcIconSvgWrapper from '@nextcloud/vue/components/NcIconSvgWrapper'
import NcNoteCard from '@nextcloud/vue/components/NcNoteCard'
import NcSelect from '@nextcloud/vue/components/NcSelect'
import { CUSTOM_VALUE, useRecipientPermissions } from '../composables/useRecipientPermissions.ts'
import { RECIPIENT_TYPE_USER } from '../constants.ts'
import { t } from '../utils/l10n.ts'
import { logger } from '../utils/logger.ts'

const props = defineProps<{
	/** The share being edited */
	share: Share
	/** The recipient this row represents */
	recipient: SharingRecipient
}>()

const {
	recipientKey,
	recipientPresetOptions,
	recipientSelectedPreset,
	recipientPermissions,
	permissionErrors,
	presetErrors,
	onRecipientPresetChange,
	onRecipientPermissionToggle,
} = useRecipientPermissions(props.share)

const isNoUser = computed(() => props.recipient.class !== RECIPIENT_TYPE_USER)
const presetOptions = computed<PresetOption[]>(() => recipientPresetOptions())
const selectedPreset = computed<PresetOption>(() => recipientSelectedPreset(props.recipient))
const permissions = computed(() => recipientPermissions(props.recipient))
const showPermissions = computed(() => selectedPreset.value.value === CUSTOM_VALUE)
const errors = computed<Record<string, string>>(() => permissionErrors[recipientKey(props.recipient)] ?? {})
const presetError = computed<string | null>(() => presetErrors[recipientKey(props.recipient)] ?? null)

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
	flex-direction: column;
	gap: var(--default-grid-baseline);

	&__header {
		display: flex;
		align-items: center;
		gap: calc(var(--default-grid-baseline) * 2);
	}

	&__name {
		flex: 1 1 auto;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	&__preset {
		flex: 0 0 auto;
		min-width: 160px;
	}

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
