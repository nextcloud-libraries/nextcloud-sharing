<!--
  SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
  SPDX-License-Identifier: GPL-3.0-or-later
-->
<template>
	<NcDialog
		class="sharing-dialog"
		name=""
		size="normal"
		@closing="emit('close')">
		<div class="sharing-dialog__header">
			<!-- Back button, shown when in settings -->
			<NcButton
				v-if="inSettings"
				class="sharing-dialog__settings-back-btn"
				variant="tertiary"
				:aria-label="t('Back to sharing options')"
				@click="inSettings = false">
				<template #icon>
					<NcIconSvgWrapper :svg="IconArrowLeft" name="Back" :size="20" />
				</template>
			</NcButton>

			<!-- Dialog title and subtitle -->
			<span class="dialog__titles">
				<h2 class="sharing-dialog__title">
					{{ dialogTitle }}
				</h2>
				<h3 v-if="inSettings" class="sharing-dialog__subtitle">
					{{ props.node.displayname }}
				</h3>
			</span>
		</div>

		<NcEmptyContent
			v-if="loading"
			class="sharing-dialog__loading"
			:name="t('Loading sharing options…')">
			<template #icon>
				<NcLoadingIcon :size="44" />
			</template>
		</NcEmptyContent>

		<NcEmptyContent
			v-else-if="error"
			class="sharing-dialog__error"
			:name="t('Failed to create share')"
			:description="error" />

		<template v-else-if="share">
			<SharePanel
				:inSettings="inSettings"
				:share="share"
				:shareDialogTab="shareDialogTab"
				@settingsWarning="(v) => (settingsHasWarning = v)"
				@settingsAvailable="(v) => (settingsAvailable = v)"
				@update:modelValue="(v) => (shareDialogTab = v)"
				@update:share="(v) => (share = v)" />
		</template>

		<!-- Settings toggle -->
		<NcButton
			v-if="!inSettings && share && settingsAvailable"
			:aria-label="t('Additional sharing settings')"
			class="sharing-dialog__settings-toggle"
			:class="{ 'sharing-dialog__settings-toggle--warning': settingsHasWarning }"
			variant="tertiary"
			@click="inSettings = true">
			<template #icon>
				<NcIconSvgWrapper :svg="IconCogOutline" name="Settings" :size="20" />
			</template>
		</NcButton>
	</NcDialog>
</template>

<script setup lang="ts">
import type { INode } from '@nextcloud/files'
import type { SharingCapabilities, SharingShare } from './types/api.ts'

import IconArrowLeft from '@mdi/svg/svg/arrow-left.svg?raw'
import IconCogOutline from '@mdi/svg/svg/cog-outline.svg?raw'
import { getCapabilities } from '@nextcloud/capabilities'
import { computed, onMounted, ref } from 'vue'
import NcButton from '@nextcloud/vue/components/NcButton'
import NcDialog from '@nextcloud/vue/components/NcDialog'
import NcEmptyContent from '@nextcloud/vue/components/NcEmptyContent'
import NcIconSvgWrapper from '@nextcloud/vue/components/NcIconSvgWrapper'
import NcLoadingIcon from '@nextcloud/vue/components/NcLoadingIcon'
import SharePanel from './components/SharePanel.vue'
import { addShareSource, createShare } from './api/sharing.ts'
import { SOURCE_TYPE_NODE } from './constants.ts'
import { logger } from './logger.ts'
import { ShareDialogTab } from './types/ui.ts'
import { t } from './utils/l10n.ts'

defineOptions({ name: 'ShareDialog' })

const props = defineProps<{
	/** The file or folder to share */
	node: INode
}>()

const emit = defineEmits<{
	(e: 'close'): void
}>()

const { sharing: sharingCapabilities } = getCapabilities() as SharingCapabilities

const inSettings = ref(false)
const loading = ref(true)
const error = ref<string | null>(null)
const share = ref<SharingShare | null>(null)

const dialogTitle = computed(() => inSettings.value
	? t('Sharing settings')
	: t('Share "{name}"', { name: props.node.displayname }))

const shareDialogTab = ref<ShareDialogTab>(ShareDialogTab.InvitedPeople)
const settingsHasWarning = ref(false)
const settingsAvailable = ref(false)

onMounted(async () => {
	try {
		// Validate source type is registered
		if (!sharingCapabilities.source_types.some((t) => t.class === SOURCE_TYPE_NODE)) {
			throw new Error('File source type not available')
		}

		// Create a draft share and attach the file as source
		const draft = await createShare()
		share.value = await addShareSource(draft.id, SOURCE_TYPE_NODE, props.node.fileid!.toString())
	} catch (e) {
		const message = e instanceof Error ? e.message : 'Unknown error'
		error.value = message
		logger.error('Failed to initialize share', { error: e })
	} finally {
		loading.value = false
	}
})

</script>

<style scoped lang="scss">
.sharing-dialog {
	// Hide the default dialog title, we use our own in the content instead
	:deep(.dialog__name) {
		display: none;
	}

	&__loading,
	&__error {
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 48px;
	}

	.sharing-dialog__settings-toggle {
		z-index: 1;
		position: absolute !important;
		top: 4px;
		inset-inline-end: var(--default-grid-baseline);
		margin-inline-end: calc(var(--button-size) + var(--default-grid-baseline));

		&--warning {
			&::after {
				content: '';
				position: absolute;
				top: 2px;
				inset-inline-end: 2px;
				width: 10px;
				height: 10px;
				border-radius: 50%;
				border: 2px solid var(--color-main-background);
				background-color: var(--color-warning);
				pointer-events: none;
			}
		}
	}
	.sharing-dialog__header {
		display: flex;
		align-items: center;
		gap: 8px;
		height: calc(var(--default-clickable-area) * 2);
		padding-inline-end: calc(var(--default-clickable-area) * 2);
	}

	.dialog__titles {
		display: flex;
		flex-direction: column;
		overflow: hidden;
		text-overflow: ellipsis;

		h2.sharing-dialog__title,
		h3.sharing-dialog__subtitle {
			margin-top: 2px;
			margin-bottom: 2px;
			line-height: 1.1em;
			font-size: 21px;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}

		h3.sharing-dialog__subtitle {
			color: var(--color-text-maxcontrast);
			font-size: 1em;
			font-weight: normal;
		}
	}
}
</style>
