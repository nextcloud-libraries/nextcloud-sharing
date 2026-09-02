<!--
  SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
  SPDX-License-Identifier: GPL-3.0-or-later
-->
<template>
	<form class="share-panel" @submit.prevent>
		<!-- First page view -->
		<template v-if="!inSettings">
			<NcRadioGroup
				class="share-panel__tab-bar"
				:modelValue="shareDialogTab"
				:label="t('Share type')"
				:hideLabel="true"
				@update:modelValue="onTabChange($event as ShareDialogTab)">
				<NcRadioGroupButton
					v-for="type in shareTypes"
					:key="type.id"
					:value="type.id"
					:label="type.label">
					<template #icon>
						<NcIconSvgWrapper :svg="type.iconSvgInline" :size="20" />
					</template>
				</NcRadioGroupButton>
			</NcRadioGroup>

			<template v-if="shareDialogTab === ShareDialogTab.InvitedPeople">
				<NcSelectUsers
					:modelValue="selectedRecipients"
					class="share-panel__recipient-search"
					:multiple="true"
					:inputLabel="t('Add people')"
					:options="results"
					:loading="searching"
					:placeholder="t('Name, team, email or federated cloud ID')"
					@update:modelValue="onSelectRecipients"
					@search="onSearchDebounced" />

				<!-- Selected recipients with per-recipient permissions -->
				<RecipientList :share="share" />
			</template>

			<!-- Permissions: default/max for the share (reused per-recipient) -->
			<PermissionEditor
				:presetOptions="presetOptions"
				:selectedPreset="selectedPresetOption"
				:showPermissions="showPermissions"
				:permissions="permissions"
				:permissionErrors="permissionErrors"
				:presetError="presetError"
				:presetLabel="presetSelectLabel"
				@presetChange="onPresetChange"
				@permissionToggle="onPermissionToggle" />

			<!-- First-page properties (e.g. Note to recipients) -->
			<template v-for="property in firstPageProperties" :key="property.class">
				<InlineToggleField
					v-if="isOptionalProperty(property)"
					:label="property.display_name"
					:longText="isLongTextProperty(property)"
					:modelValue="property.value !== null"
					@update:modelValue="(enabled) => toggleOptionalProperty(property, enabled)">
					<template #default="{ inputId }">
						<PropertyField
							v-model="property.value"
							:disabled="property.value === null"
							:inputId="inputId"
							:property="property"
							:share="share" />
					</template>
				</InlineToggleField>
				<PropertyField
					v-else
					v-model="property.value"
					:property="property"
					:share="share" />
			</template>

			<!-- Public link on a folder: uploaded content lands in it -->
			<NcNoteCard v-if="folderUploadHint" type="info">
				{{ folderUploadHint }}
			</NcNoteCard>

			<!-- Plain-language summary of the share's expiration/password outcome -->
			<NcNoteCard v-if="shareSummary" type="info">
				{{ shareSummary }}
			</NcNoteCard>

			<!-- Failure while establishing/removing the public link -->
			<NcNoteCard v-if="linkRecipientError" type="error">
				<span>{{ linkRecipientError }}</span>
				<NcButton :disabled="linkRecipientLoading" @click="retryTokenRecipient">
					{{ t('Retry') }}
				</NcButton>
			</NcNoteCard>

			<!-- Failure while submitting the share -->
			<NcNoteCard v-if="submitError" type="error">
				{{ submitError }}
			</NcNoteCard>

			<!-- Link actions -->
			<div class="share-panel__link-actions">
				<NcButton
					class="share-panel__link-copy"
					:aria-label="copyLinkLabel"
					:disabled="linkActionsDisabled || submitting"
					@click="copyLink">
					<template #icon>
						<NcLoadingIcon v-if="linkRecipientLoading" :size="20" />
						<NcIconSvgWrapper v-else :svg="IconContentCopy" :size="20" />
					</template>
					{{ copied ? t('Copied!') : copyLinkLabel }}
				</NcButton>
				<NcButton
					class="share-panel__link-send"
					variant="primary"
					:aria-label="t('Send share link')"
					:disabled="linkActionsDisabled || submitting || !canSubmit"
					@click="sendLink">
					<template #icon>
						<NcLoadingIcon v-if="submitting" :size="20" />
						<NcIconSvgWrapper v-else :svg="IconSend" :size="20" />
					</template>
					{{ t('Send') }}
				</NcButton>
			</div>
		</template>

		<!-- Settings view -->
		<template v-else>
			<!-- Warning if required settings properties are empty -->
			<NcNoteCard
				v-if="hasSettingsWarning"
				type="warning"
				class="share-panel__settings-warning">
				{{ t('Some required fields are missing') }}
			</NcNoteCard>

			<template v-for="property in settingsProperties" :key="property.class">
				<InlineToggleField
					v-if="isOptionalProperty(property)"
					:label="property.display_name"
					:longText="isLongTextProperty(property)"
					:modelValue="property.value !== null"
					@update:modelValue="(enabled) => toggleOptionalProperty(property, enabled)">
					<template #default="{ inputId }">
						<PropertyField
							v-model="property.value"
							:disabled="property.value === null"
							:inputId="inputId"
							:property="property"
							:share="share" />
					</template>
				</InlineToggleField>
				<PropertyField
					v-else
					v-model="property.value"
					:property="property"
					:share="share" />
			</template>
		</template>
	</form>
</template>

<script setup lang="ts">
import type { Share } from '../api/share.ts'

import AccountPlusOutlineIconSvg from '@mdi/svg/svg/account-plus-outline.svg?raw'
import IconContentCopy from '@mdi/svg/svg/content-copy.svg?raw'
import IconSend from '@mdi/svg/svg/send-outline.svg?raw'
import WorldMapOutlineSvg from '@mdi/svg/svg/web.svg?raw'
import { DialogBuilder } from '@nextcloud/dialogs'
import { computed, ref, watch } from 'vue'
import NcButton from '@nextcloud/vue/components/NcButton'
import NcIconSvgWrapper from '@nextcloud/vue/components/NcIconSvgWrapper'
import NcLoadingIcon from '@nextcloud/vue/components/NcLoadingIcon'
import NcNoteCard from '@nextcloud/vue/components/NcNoteCard'
import NcRadioGroup from '@nextcloud/vue/components/NcRadioGroup'
import NcRadioGroupButton from '@nextcloud/vue/components/NcRadioGroupButton'
import NcSelectUsers from '@nextcloud/vue/components/NcSelectUsers'
import InlineToggleField from './InlineToggleField.vue'
import PermissionEditor from './PermissionEditor.vue'
import PropertyField from './PropertyField.vue'
import RecipientList from './RecipientList.vue'
import { useLinkShare } from '../composables/useLinkShare.ts'
import { usePermissionPresets } from '../composables/usePermissionPresets.ts'
import { useRecipientSearch } from '../composables/useRecipientSearch.ts'
import { useShareProperties } from '../composables/useShareProperties.ts'
import { PROPERTY_EXPIRATION, PROPERTY_PASSWORD, RECIPIENT_TYPE_TOKEN } from '../constants.ts'
import { ShareDialogTab } from '../types/ui.ts'
import { getOcsErrorMessage } from '../utils/api.ts'
import { n, t } from '../utils/l10n.ts'
import { logger } from '../utils/logger.ts'
import { isLongTextProperty, isOptionalProperty } from '../utils/property.ts'
import { shareOutcomeSummary } from '../utils/summary.ts'

/** The active dialog tab */
const shareDialogTab = defineModel<ShareDialogTab>('shareDialogTab', { required: true })

const props = defineProps<{
	/** The share being edited */
	share: Share
	/** Whether the settings view is shown instead of the first page */
	inSettings: boolean
	/** Name of the shared folder, when the source is a folder (for the upload hint) */
	folderName?: string | null
}>()

const emit = defineEmits<{
	(e: 'settingsWarning', value: boolean): void
	(e: 'settingsAvailable', value: boolean): void
	(e: 'submitted', value: { link: string | null, isPublic: boolean }): void
}>()

const isLinkShare = computed(() => shareDialogTab.value === ShareDialogTab.Anyone)

// A share cannot be submitted without at least one recipient.
const canSubmit = computed(() => props.share.recipients.length > 0)

// Invited people: every recipient except the link (token) one.
const invitedRecipients = computed(() => props.share.recipients.filter((recipient) => recipient.class !== RECIPIENT_TYPE_TOKEN))

/**
 * Ask before dropping the invited people when switching to a public link.
 *
 * @param count Number of invited people that would be removed
 */
async function confirmDropInvited(count: number): Promise<boolean> {
	let confirmed = false
	const dialog = (new DialogBuilder())
		.setName(t('Share with anyone'))
		.setText(n(
			'Switching to a public link removes %n invited person from this share.',
			'Switching to a public link removes %n invited people from this share.',
			count,
		))
		.setButtons([
			{
				label: t('Cancel'),
				variant: 'secondary',
				callback: () => {},
			},
			{
				label: t('Continue'),
				variant: 'primary',
				callback: () => {
					confirmed = true
				},
			},
		])
		.build()
	try {
		await dialog.show()
	} catch (e) {
		logger.debug('Share type confirmation dialog closed', { error: e })
	}
	return confirmed
}

/**
 * Switch the share type. A public link cannot keep invited people, so confirm
 * and remove them first.
 *
 * @param tab The tab to switch to
 */
async function onTabChange(tab: ShareDialogTab) {
	if (tab === shareDialogTab.value) {
		return
	}
	if (tab === ShareDialogTab.Anyone && invitedRecipients.value.length > 0) {
		if (!await confirmDropInvited(invitedRecipients.value.length)) {
			return
		}
		for (const recipient of invitedRecipients.value) {
			try {
				await props.share.removeRecipient(recipient.class, recipient.value, recipient.instance ?? undefined)
			} catch (e) {
				logger.error('Failed to remove recipient while switching to a link share', { error: e, recipient: recipient.value })
			}
		}
	}
	shareDialogTab.value = tab
}

// Editable properties, permissions/presets, recipient search and link handling
// live in dedicated composables; this component wires them to the template.
const {
	properties,
	firstPageProperties,
	settingsProperties,
	hasSettingsWarning,
	hasSettings,
	toggleOptionalProperty,
} = useShareProperties(props.share)

const {
	permissions,
	presetOptions,
	selectedPresetOption,
	showPermissions,
	permissionErrors,
	presetError,
	onPresetChange,
	onPermissionToggle,
} = usePermissionPresets(props.share)

const { results, selected: selectedRecipients, searching, onSelect: onSelectRecipients, onSearch: onSearchDebounced } = useRecipientSearch(props.share)

const {
	linkRecipientLoading,
	linkRecipientError,
	linkActionsDisabled,
	resolvedLink,
	copied,
	retryTokenRecipient,
	copyLink,
} = useLinkShare(props.share, isLinkShare)

watch(hasSettingsWarning, (v) => emit('settingsWarning', v), { immediate: true })
watch(hasSettings, (v) => emit('settingsAvailable', v), { immediate: true })

// Plain-language summary of the outcome, inspired by the file request dialog.
const expirationDate = computed(() => {
	const value = properties.find((p) => p.class === PROPERTY_EXPIRATION)?.value
	if (!value) {
		return null
	}
	const date = new Date(value)
	return Number.isNaN(date.getTime()) ? null : date
})

const isPasswordProtected = computed(() => {
	const value = properties.find((p) => p.class === PROPERTY_PASSWORD)?.value
	return value !== null && value !== undefined && value !== ''
})

const shareSummary = computed<string | null>(() => shareOutcomeSummary(expirationDate.value, isPasswordProtected.value))

// For a public link on a folder, hint that anything uploaded lands in it.
const folderUploadHint = computed<string | null>(() => isLinkShare.value && props.folderName
	? t('Files and folders uploaded via the link will be added to "{folder}".', { folder: props.folderName })
	: null)

const copyLinkLabel = computed(() => isLinkShare.value ? t('Copy public link') : t('Copy private link'))
const presetSelectLabel = computed(() => isLinkShare.value ? t('Anyone with the link') : t('Default permission'))

const shareTypes = [
	{ id: ShareDialogTab.InvitedPeople, label: t('Invited people'), iconSvgInline: AccountPlusOutlineIconSvg },
	{ id: ShareDialogTab.Anyone, label: t('Anyone'), iconSvgInline: WorldMapOutlineSvg },
]

const submitting = ref(false)
const submitError = ref<string | null>(null)

// Clear a stale submit error when switching between the invited/anyone tabs.
watch(shareDialogTab, () => {
	submitError.value = null
})

/**
 * Submit the share: activate the draft (which validates it and notifies mail
 * recipients), then hand off to the confirmation view.
 */
async function sendLink() {
	submitting.value = true
	submitError.value = null
	try {
		if (props.share.state === 'draft') {
			await props.share.activate()
		}
		emit('submitted', { link: resolvedLink.value, isPublic: isLinkShare.value })
	} catch (e) {
		logger.error('Failed to submit share', { error: e })
		submitError.value = getOcsErrorMessage(e)
	} finally {
		submitting.value = false
	}
}
</script>

<style scoped lang="scss">
form.share-panel {
	display: flex;
	flex-direction: column;
	gap: calc(var(--default-grid-baseline) * 3);

	// Keep fields at their natural height when the form scrolls, instead of
	// letting flex shrink (compress) them to fit the max-height.
	> * {
		flex-shrink: 0;
		min-width: 0;
	}
}

.share-panel__link-actions {
	display: flex;
	gap: calc(var(--default-grid-baseline) * 3);
	> button {
		flex: 1 1 50%;
	}
}
</style>
