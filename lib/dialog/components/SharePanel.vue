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
				@update:modelValue="(v: string) => emit('update:modelValue', v as ShareDialogTab)">
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

			<NcSelectUsers
				v-if="shareDialogTab === ShareDialogTab.InvitedPeople"
				v-model="selectedRecipient"
				class="share-panel__recipient-search"
				:inputLabel="t('Add people')"
				:options="results"
				:loading="searching"
				:placeholder="t('Name, team, email or federated cloud ID')"
				@search="onSearchDebounced" />

			<!-- Permissions - core feature -->
			<NcSelect
				:modelValue="selectedPresetOption"
				:clearable="false"
				:searchable="false"
				:inputLabel="presetSelectLabel"
				:options="presetOptions"
				class="share-panel__permissions-preset-select"
				:placeholder="t('Can…')"
				@update:modelValue="onPresetChange" />

			<!-- Fine-grained permission toggles, shown while "Can…" is selected -->
			<Transition name="expand">
				<div v-if="showPermissions" class="share-panel__permissions">
					<div class="share-panel__permissions-inner">
						<NcFormBox>
							<NcFormBoxSwitch
								v-for="permission in permissions"
								:key="permission.class"
								:label="permission.display_name"
								:description="permission.hint ?? undefined"
								:error="permissionErrors[permission.class]"
								:modelValue="permission.enabled"
								@update:modelValue="(enabled) => onPermissionToggle(permission, enabled)" />
						</NcFormBox>
					</div>
				</div>
			</Transition>

			<!-- Preset-level error (the toggles are hidden while a preset is selected) -->
			<NcNoteCard v-if="presetError" type="error">
				{{ presetError }}
			</NcNoteCard>

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

			<!-- Failure while establishing/removing the public link -->
			<NcNoteCard v-if="linkRecipientError" type="error">
				<span>{{ linkRecipientError }}</span>
				<NcButton :disabled="linkRecipientLoading" @click="retryTokenRecipient">
					{{ t('Retry') }}
				</NcButton>
			</NcNoteCard>

			<!-- Link actions -->
			<div class="share-panel__link-actions">
				<NcButton
					class="share-panel__link-copy"
					:aria-label="copyLinkLabel"
					:disabled="linkActionsDisabled"
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
					:disabled="linkActionsDisabled"
					@click="sendLink">
					<template #icon>
						<NcIconSvgWrapper :svg="IconSend" :size="20" />
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
import type { NcSelectUsersModel } from '@nextcloud/vue/components/NcSelectUsers'
import type { SharingPermission, SharingPermissionPreset, SharingProperty, SharingShare } from '../types/api.ts'

import AccountPlusOutlineIconSvg from '@mdi/svg/svg/account-plus-outline.svg?raw'
import IconContentCopy from '@mdi/svg/svg/content-copy.svg?raw'
import IconSend from '@mdi/svg/svg/send.svg?raw'
import WorldMapOutlineSvg from '@mdi/svg/svg/web.svg?raw'
import { generateUrl } from '@nextcloud/router'
import debounce from 'debounce'
import { computed, reactive, ref, watch } from 'vue'
import NcButton from '@nextcloud/vue/components/NcButton'
import NcFormBox from '@nextcloud/vue/components/NcFormBox'
import NcFormBoxSwitch from '@nextcloud/vue/components/NcFormBoxSwitch'
import NcIconSvgWrapper from '@nextcloud/vue/components/NcIconSvgWrapper'
import NcLoadingIcon from '@nextcloud/vue/components/NcLoadingIcon'
import NcNoteCard from '@nextcloud/vue/components/NcNoteCard'
import NcRadioGroup from '@nextcloud/vue/components/NcRadioGroup'
import NcRadioGroupButton from '@nextcloud/vue/components/NcRadioGroupButton'
import NcSelect from '@nextcloud/vue/components/NcSelect'
import NcSelectUsers from '@nextcloud/vue/components/NcSelectUsers'
import InlineToggleField from './InlineToggleField.vue'
import PropertyField from './PropertyField.vue'
import { addShareRecipient, removeShareRecipient, searchRecipients, selectSharePermissionPreset, updateSharePermission, updateShareProperty, updateShareState } from '../api/sharing.ts'
import { FIRST_PAGE_PROPERTIES, HIDDEN_PROPERTIES, PROPERTY_URL, RECIPIENT_TYPE_TOKEN, SOURCE_TYPE_NODE } from '../constants.ts'
import { logger } from '../logger.ts'
import { ShareDialogTab } from '../types/ui.ts'
import { getOcsErrorMessage, recipientToNcSelectUsersModel } from '../utils/api.ts'
import { t } from '../utils/l10n.ts'

defineOptions({ name: 'SharePanel' })
const props = defineProps<{
	/** The share being edited */
	share: SharingShare
	/** The active dialog tab */
	shareDialogTab: ShareDialogTab
	/** Whether the settings view is shown instead of the first page */
	inSettings: boolean
}>()
const emit = defineEmits<{
	(e: 'update:modelValue', value: ShareDialogTab): void
	(e: 'update:share', value: SharingShare): void
	(e: 'settingsWarning', value: boolean): void
	(e: 'settingsAvailable', value: boolean): void
}>()

// Local reactive copy of properties for two-way binding with PropertyField
const properties = reactive<SharingProperty[]>(props.share.properties.map((p) => ({ ...p })))

/**
 * Sync local properties from an updated share response.
 * Preserves local values for existing properties, adds new ones.
 *
 * @param updated
 */
function syncFromShare(updated: SharingShare) {
	emit('update:share', updated)

	const existing = new Map(properties.map((p) => [p.class, p]))
	properties.length = 0
	for (const p of updated.properties) {
		// Keep local value if property already existed (user may have unsaved edits)
		const local = existing.get(p.class)
		properties.push(local ? { ...p, value: local.value } : { ...p })
	}
}

const firstPageProperties = computed(() => properties.filter((p) => FIRST_PAGE_PROPERTIES.includes(p.class)))

const settingsProperties = computed(() => properties.filter((p) => !HIDDEN_PROPERTIES.includes(p.class)
	&& !FIRST_PAGE_PROPERTIES.includes(p.class)))

const urlProperty = computed(() => properties.find((p) => p.class === PROPERTY_URL) ?? null)

const isLinkShare = computed(() => props.shareDialogTab === ShareDialogTab.Anyone)

const copyLinkLabel = computed(() => isLinkShare.value
	? t('Copy public link')
	: t('Copy private link'))

const presetSelectLabel = computed(() => isLinkShare.value
	? t('Anyone with the link')
	: t('Participants'))

// Private link points at the file directly (domain.com/f/{fileid}),
// resolved from the node source's fileid, not the share URL property.
const privateLinkUrl = computed(() => {
	const fileid = props.share.sources.find((s) => s.class === SOURCE_TYPE_NODE)?.value
	return fileid ? window.location.origin + generateUrl('/f/{fileid}', { fileid }) : null
})

const hasSettingsWarning = computed(() => settingsProperties.value.some((p) => p.required && (p.value === null || p.value === '')))

watch(hasSettingsWarning, (v) => emit('settingsWarning', v), { immediate: true })

// Whether the settings view has anything to show (drives the settings cog).
const hasSettings = computed(() => settingsProperties.value.length > 0)

watch(hasSettings, (v) => emit('settingsAvailable', v), { immediate: true })

// A link share is just a share with a token recipient.
const tokenRecipient = computed(() => props.share.recipients.find((r) => r.class === RECIPIENT_TYPE_TOKEN) ?? null)

/**
 * Generate a random token value. Link recipients require a value of 32-255 chars.
 */
function generateShareToken(): string {
	const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
	const bytes = new Uint8Array(32)
	crypto.getRandomValues(bytes)
	return Array.from(bytes, (b) => chars[b % chars.length]).join('')
}

// Progress + error state for the token-recipient mutation triggered on tab switch.
const linkRecipientLoading = ref(false)
const linkRecipientError = ref<string | null>(null)

/**
 * Keep the token recipient in sync with the tab: add it on "Anyone" (so the
 * backend returns the link properties), remove it otherwise so it doesn't leak
 * its link-only properties into the "Invited people" view.
 *
 * @param tab The active tab
 */
async function syncTokenRecipient(tab: ShareDialogTab) {
	const needsToken = tab === ShareDialogTab.Anyone
	if (needsToken === !!tokenRecipient.value) {
		// Already in the desired state, nothing to do.
		return
	}

	linkRecipientError.value = null
	linkRecipientLoading.value = true
	try {
		if (needsToken) {
			syncFromShare(await addShareRecipient(props.share.id, RECIPIENT_TYPE_TOKEN, generateShareToken()))
		} else {
			const { class: recipientClass, value, instance } = tokenRecipient.value!
			syncFromShare(await removeShareRecipient(props.share.id, recipientClass, value, instance ?? undefined))
		}
	} catch (e) {
		logger.error('Failed to sync link share recipient', { error: e, tab })
		linkRecipientError.value = getOcsErrorMessage(e)
	} finally {
		linkRecipientLoading.value = false
	}
}

watch(() => props.shareDialogTab, syncTokenRecipient, { immediate: true })

/**
 * Retry establishing the link share after a failure.
 */
function retryTokenRecipient() {
	syncTokenRecipient(props.shareDialogTab)
}

// Link actions are unusable while the recipient sync runs, or on the Anyone tab
// before its token recipient exists (e.g. it failed to be created).
const linkActionsDisabled = computed(() => linkRecipientLoading.value || (isLinkShare.value && !tokenRecipient.value))

/**
 * Check if a property is a long-text (textarea) field.
 *
 * @param property
 */
function isLongTextProperty(property: SharingProperty): boolean {
	return property.type === 'string' && (property.max_length ?? 0) > 255
}

/**
 * Check if a property is optional (can be toggled on/off).
 *
 * @param property
 */
function isOptionalProperty(property: SharingProperty): boolean {
	if (property.type === 'boolean') {
		return false
	}
	return !property.required
}

/**
 * Get a suitable default value for a property based on its type.
 *
 * @param property
 */
function getDefaultValue(property: SharingProperty): string {
	switch (property.type) {
		case 'boolean':
			return 'false'
		case 'string':
		case 'password':
		case 'date':
			// Empty so enabling the toggle doesn't dispatch until the user picks a value.
			return ''
		case 'enum':
			return property.valid_values?.[0] ?? ''
		default:
			return ''
	}
}

/**
 * Toggle optional property on/off.
 *
 * Enabling only reveals the field locally — an empty value is not persisted
 * because the backend rejects it (e.g. the note needs at least 1 character);
 * PropertyField saves it once the user enters a value. Disabling persists null
 * to clear the property.
 *
 * @param property
 * @param enabled
 */
async function toggleOptionalProperty(property: SharingProperty, enabled: boolean) {
	const previousValue = property.value
	const newValue = enabled ? getDefaultValue(property) : null
	property.value = newValue

	// Don't dispatch an empty value on enable; wait for the user to type one.
	if (enabled && (newValue === null || newValue === '')) {
		return
	}

	try {
		await updateShareProperty(props.share.id, property.class, newValue)
	} catch (e) {
		// Revert the toggle; the reverted state is the user-facing feedback.
		property.value = previousValue
		logger.error('Failed to toggle property', { error: e })
	}
}

const copied = ref(false)

/**
 * Copy text to the clipboard, with a fallback for insecure (http) contexts
 * where navigator.clipboard is unavailable.
 *
 * @param text The text to copy
 */
async function copyToClipboard(text: string) {
	if (navigator.clipboard?.writeText) {
		await navigator.clipboard.writeText(text)
		return
	}
	const textarea = document.createElement('textarea')
	textarea.value = text
	textarea.style.position = 'fixed'
	textarea.style.opacity = '0'
	document.body.appendChild(textarea)
	textarea.select()
	try {
		document.execCommand('copy')
	} finally {
		document.body.removeChild(textarea)
	}
}

/**
 *
 */
async function copyLink() {
	try {
		let share = props.share
		// A public link's URL (and its share token) only exists once the share is
		// validated/active — activate the draft first, then read the fresh URL.
		if (isLinkShare.value && share.state === 'draft') {
			share = await updateShareState(share.id, 'active')
			syncFromShare(share)
		}
		// The public link URL is exposed on the token recipient's secret, not as a
		// property. The private link points straight at the file by its node id.
		const url = isLinkShare.value
			? share.recipients.find((r) => r.class === RECIPIENT_TYPE_TOKEN)?.secret.url ?? null
			: privateLinkUrl.value
		if (!url) {
			logger.warn('No link available to copy', { isLinkShare: isLinkShare.value })
			return
		}
		await copyToClipboard(url)
		copied.value = true
		setTimeout(() => {
			copied.value = false
		}, 2000)
	} catch (e) {
		logger.error('Failed to copy link to clipboard', { error: e })
	}
}

/**
 *
 */
function sendLink() {
	// TODO: implement send flow
	logger.debug('Send link clicked', { url: urlProperty.value?.value })
}

const shareTypes = ref([
	{
		id: ShareDialogTab.InvitedPeople,
		label: t('Invited people'),
		iconSvgInline: AccountPlusOutlineIconSvg,
	},
	{
		id: ShareDialogTab.Anyone,
		label: t('Anyone'),
		iconSvgInline: WorldMapOutlineSvg,
	},
])

const results = ref<NcSelectUsersModel[]>([])
const selectedRecipient = ref<NcSelectUsersModel | undefined>(undefined)
const searching = ref(false)

// Map selected user IDs back to their SharingRecipient class for API calls
const recipientClassMap = new Map<string, string>()

/**
 * Watch for single recipient selection change and sync with the API.
 */
watch(selectedRecipient, async (newVal, oldVal) => {
	// Remove previous recipient
	if (oldVal) {
		const recipientClass = recipientClassMap.get(oldVal.id)
		if (recipientClass) {
			try {
				const updated = await removeShareRecipient(props.share.id, recipientClass, oldVal.id)
				syncFromShare(updated)
			} catch (e) {
				logger.error('Failed to remove recipient', { error: e, recipient: oldVal })
			}
		}
	}

	// Add new recipient
	if (newVal) {
		const recipientClass = recipientClassMap.get(newVal.id)
		if (recipientClass) {
			try {
				const updated = await addShareRecipient(props.share.id, recipientClass, newVal.id)
				syncFromShare(updated)
			} catch (e) {
				logger.error('Failed to add recipient', { error: e, recipient: newVal })
			}
		}
	}
})

// Sentinel for the read-only "custom" entry shown when no preset matches.
const CUSTOM_VALUE = 'custom'

type PresetValue = SharingPermissionPreset | typeof CUSTOM_VALUE
type PresetOption = { value: PresetValue, label: string }

// The backend exposes no preset labels (the SharePermissionPreset enum is
// value-only), so they are mapped here. Unknown presets fall back to their raw
// value, keeping the preset set backend-driven rather than gated to known ones.
const PRESET_LABELS: Partial<Record<SharingPermissionPreset, string>> = {
	view: t('Can view'),
	edit: t('Can edit'),
}

/**
 * Human label for a preset, falling back to its raw value if unmapped.
 *
 * @param preset The preset value
 */
function presetLabel(preset: SharingPermissionPreset): string {
	return PRESET_LABELS[preset] ?? t('Can {preset}', { preset })
}

// Always-present entry that reveals the individual permission toggles.
const customOption: PresetOption = { value: CUSTOM_VALUE, label: t('Can…') }

// Preserve first-seen order so toggling a permission never reorders the list
// (the backend may return permissions in a different order after an update).
const permissionOrder = new Map<string, number>()
const permissions = computed<SharingPermission[]>(() => {
	for (const permission of props.share.permissions) {
		if (!permissionOrder.has(permission.class)) {
			permissionOrder.set(permission.class, permissionOrder.size)
		}
	}
	return [...props.share.permissions].sort((a, b) => (permissionOrder.get(a.class) ?? 0) - (permissionOrder.get(b.class) ?? 0))
})

// Presets offered by this share = the union of the presets its permissions
// belong to, in first-seen order. Fully backend-driven, no fixed preset list.
const availablePresets = computed<SharingPermissionPreset[]>(() => {
	const seen = new Set<SharingPermissionPreset>()
	for (const permission of permissions.value) {
		for (const preset of permission.presets) {
			seen.add(preset)
		}
	}
	return [...seen]
})

// The "Can…" custom entry is always offered, in addition to the presets.
const presetOptions = computed<PresetOption[]>(() => [
	...availablePresets.value.map((p) => ({ value: p, label: presetLabel(p) })),
	customOption,
])

// Local selection so the custom view is sticky: once the user is on "Can…" we
// keep it — and keep the toggles shown — even if their edits happen to match a
// preset. They only leave custom by explicitly picking a preset. Initialised
// from the backend (null preset === no match === custom).
const selectedValue = ref<PresetValue>(props.share.permission_preset ?? CUSTOM_VALUE)

const selectedPresetOption = computed<PresetOption | null>(() => presetOptions.value.find((o) => o.value === selectedValue.value) ?? null)

const showPermissions = computed(() => selectedValue.value === CUSTOM_VALUE)

// Backend rejection errors (e.g. requesting more rights than you hold), surfaced
// where the change was made: per-permission on its own toggle, preset-level in a note.
const permissionErrors = reactive<Record<string, string>>({})
const presetError = ref<string | null>(null)

/**
 * Apply a preset, or switch to the custom view. Picking a preset enables its
 * permissions server-side; picking "Can…" only reveals the toggles.
 *
 * @param option The selected dropdown option
 */
async function onPresetChange(option: PresetOption | null) {
	if (!option) {
		return
	}
	selectedValue.value = option.value
	if (option.value === CUSTOM_VALUE) {
		return
	}
	presetError.value = null
	try {
		const updated = await selectSharePermissionPreset(props.share.id, option.value)
		syncFromShare(updated)
	} catch (e) {
		logger.error('Failed to select permission preset', { error: e, preset: option.value })
		presetError.value = getOcsErrorMessage(e)
	}
}

/**
 * Toggle a single permission on the share.
 *
 * @param permission The permission to toggle
 * @param enabled The new enabled state
 */
async function onPermissionToggle(permission: SharingPermission, enabled: boolean) {
	delete permissionErrors[permission.class]
	try {
		const updated = await updateSharePermission(props.share.id, permission.class, enabled)
		syncFromShare(updated)
	} catch (e) {
		logger.error('Failed to toggle permission', { error: e, permission: permission.class })
		permissionErrors[permission.class] = getOcsErrorMessage(e)
	}
}

/**
 * Search for share recipients based on the given
 * query and update the local cached results.
 *
 * @param query The search query entered by the user
 */
async function onSearch(query: string) {
	if (!query) {
		results.value = []
		return
	}

	searching.value = true
	try {
		const recipients = await searchRecipients(query)
		// Track recipient class for each value so we can call the API on selection
		for (const r of recipients) {
			recipientClassMap.set(r.value, r.class)
		}
		results.value = recipients.map(recipientToNcSelectUsersModel)
	} catch (e) {
		logger.error('Failed to search recipients', { error: e })
		results.value = []
	} finally {
		searching.value = false
	}
}
const onSearchDebounced = debounce(onSearch, 150)

</script>

<style scoped lang="scss">
form.share-panel {
	display: flex;
	flex-direction: column;
	gap: calc(var(--default-grid-baseline) * 4);
	margin-block: calc(var(--default-grid-baseline) * 2);
}

// Animate the permission list open/closed via the grid-rows 0fr→1fr trick.
.share-panel__permissions {
	display: grid;
	grid-template-rows: 1fr;
}

.share-panel__permissions-inner {
	overflow: hidden;
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

.share-panel__link-actions {
	display: flex;
	gap: calc(var(--default-grid-baseline) * 3);
	> button {
		flex: 1 1 50%;
	}
}
</style>
