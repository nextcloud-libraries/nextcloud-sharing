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
					<NcIconSvgWrapper :svg="IconArrowLeft" directional />
				</template>
			</NcButton>

			<!-- Dialog title and subtitle -->
			<span class="dialog__titles">
				<h2 class="sharing-dialog__title">
					{{ dialogTitle }}
				</h2>
				<h3 v-if="inSettings && nodeName" class="sharing-dialog__subtitle">
					{{ nodeName }}
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
				:folderName="folderName"
				:shareDialogTab="shareDialogTab"
				@settingsWarning="settingsHasWarning = $event"
				@settingsAvailable="settingsAvailable = $event"
				@update:modelValue="shareDialogTab = $event" />
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
				<NcIconSvgWrapper :svg="IconCogOutline" />
			</template>
		</NcButton>
	</NcDialog>
</template>

<script setup lang="ts">
import type { INode } from '@nextcloud/files'
import type { Share } from './api/share.ts'
import type { SharingCapabilities } from './types/api.ts'

import IconArrowLeft from '@mdi/svg/svg/arrow-left.svg?raw'
import IconCogOutline from '@mdi/svg/svg/cog-outline.svg?raw'
import { getCapabilities } from '@nextcloud/capabilities'
import { FileType } from '@nextcloud/files'
import { computed, onMounted, ref, shallowRef } from 'vue'
import NcButton from '@nextcloud/vue/components/NcButton'
import NcDialog from '@nextcloud/vue/components/NcDialog'
import NcEmptyContent from '@nextcloud/vue/components/NcEmptyContent'
import NcIconSvgWrapper from '@nextcloud/vue/components/NcIconSvgWrapper'
import NcLoadingIcon from '@nextcloud/vue/components/NcLoadingIcon'
import SharePanel from './components/SharePanel.vue'
import { createShare } from './api/share.ts'
import { SOURCE_TYPE_NODE } from './constants.ts'
import { ShareDialogTab } from './types/ui.ts'
import { t } from './utils/l10n.ts'
import { logger } from './utils/logger.ts'

const props = defineProps<{
	/** An existing share to edit. Provide this or {@link node}. */
	share?: Share
	/** The file or folder to share. A draft share is created for it. */
	node?: INode
}>()

const emit = defineEmits<{
	(e: 'close'): void
}>()

const { sharing: sharingCapabilities } = getCapabilities() as SharingCapabilities

const inSettings = ref(false)
// Loading only while a draft is being created for a node; a passed-in share is ready.
const loading = ref(!props.share)
const error = ref<string | null>(null)
const share = shallowRef<Share | null>(props.share ?? null)

// Display name for the title/subtitle, from the node if one was provided.
const nodeName = computed(() => props.node?.displayname ?? null)

// Folder name when the shared node is a folder, used to hint that public
// uploads land in it. Null for files or when opened without a node.
const folderName = computed(() => props.node?.type === FileType.Folder ? props.node.displayname : null)

const dialogTitle = computed(() => {
	if (inSettings.value) {
		return t('Sharing settings')
	}
	return nodeName.value
		? t('Share "{name}"', { name: nodeName.value })
		: t('Share')
})

const shareDialogTab = ref<ShareDialogTab>(ShareDialogTab.InvitedPeople)
const settingsHasWarning = ref(false)
const settingsAvailable = ref(false)

onMounted(async () => {
	// A ready share was passed in; nothing to create.
	if (share.value) {
		return
	}

	try {
		if (!props.node) {
			throw new Error('Either a share or a node must be provided')
		}
		// Validate source type is registered
		if (!sharingCapabilities.source_types.some((t) => t.class === SOURCE_TYPE_NODE)) {
			throw new Error('File source type not available')
		}

		// Create a draft share and attach the file as source
		const draft = await createShare()
		await draft.addNode(props.node)
		share.value = draft
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

	// Consistent vertical rhythm between the header and the form.
	:deep(.dialog__content) {
		display: flex;
		flex-direction: column;
		gap: calc(var(--default-grid-baseline) * 3);
	}

	// Scroll the form (everything but the fixed header/close) once it grows
	// tall, so the scrollbar never overlaps the header. A max-height rather than
	// flex is used so the dialog still sizes to its content when it is short.
	:deep(.share-panel) {
		max-height: 50vh;
		overflow-y: auto;
		// Match the dialog's inline padding at the bottom (its content has none),
		// so the form does not sit flush against the edge.
		padding-block-end: calc(var(--default-grid-baseline) * 3);
	}

	&__loading,
	&__error {
		display: flex;
		justify-content: center;
		align-items: center;
		padding: calc(var(--default-grid-baseline) * 12);
	}

	.sharing-dialog__settings-toggle {
		z-index: 1;
		position: absolute !important;
		top: var(--default-grid-baseline);
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
		gap: calc(var(--default-grid-baseline) * 2);
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
		}

		h2.sharing-dialog__title {
			word-break: break-all;
		}

		h3.sharing-dialog__subtitle {
			color: var(--color-text-maxcontrast);
			font-size: 1em;
			font-weight: normal;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}
	}
}
</style>
