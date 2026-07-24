<!--
  SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
  SPDX-License-Identifier: GPL-3.0-or-later
-->
<template>
	<div class="share-confirmation">
		<NcIconSvgWrapper class="share-confirmation__icon" :svg="IconCheckCircle" :size="44" />

		<h3 class="share-confirmation__title">
			{{ isPublic ? t('Your share link is ready') : t('Your share is ready') }}
		</h3>

		<template v-if="link">
			<!-- QR code, only useful for a public link -->
			<QrcodeVue
				v-if="isPublic"
				class="share-confirmation__qr"
				:value="link"
				:size="200"
				level="M" />

			<!-- Copy the link -->
			<div class="share-confirmation__link">
				<NcTextField
					class="share-confirmation__link-input"
					:label="t('Share link')"
					:modelValue="link"
					readonly />
				<NcButton
					:aria-label="t('Copy to clipboard')"
					@click="copyLink">
					<template #icon>
						<NcIconSvgWrapper :svg="copied ? IconCheck : IconContentCopy" :size="20" />
					</template>
					{{ copied ? t('Copied!') : t('Copy') }}
				</NcButton>
			</div>
		</template>

		<NcButton
			class="share-confirmation__done"
			variant="primary"
			@click="emit('close')">
			{{ t('Done') }}
		</NcButton>
	</div>
</template>

<script setup lang="ts">
import IconCheckCircle from '@mdi/svg/svg/check-circle-outline.svg?raw'
import IconCheck from '@mdi/svg/svg/check.svg?raw'
import IconContentCopy from '@mdi/svg/svg/content-copy.svg?raw'
import { ref } from 'vue'
import NcButton from '@nextcloud/vue/components/NcButton'
import NcIconSvgWrapper from '@nextcloud/vue/components/NcIconSvgWrapper'
import NcTextField from '@nextcloud/vue/components/NcTextField'
import QrcodeVue from 'qrcode.vue'
import { copyToClipboard } from '../utils/clipboard.ts'
import { t } from '../utils/l10n.ts'
import { logger } from '../utils/logger.ts'

const props = defineProps<{
	/** The share link to present, or null when there is none */
	link: string | null
	/** Whether this is a public (link) share, enabling the QR code */
	isPublic: boolean
}>()

const emit = defineEmits<{
	(e: 'close'): void
}>()

const copied = ref(false)

/**
 * Copy the link to the clipboard and briefly reflect it in the button.
 */
async function copyLink() {
	if (!props.link) {
		return
	}
	try {
		await copyToClipboard(props.link)
		copied.value = true
		setTimeout(() => {
			copied.value = false
		}, 2000)
	} catch (e) {
		logger.error('Failed to copy link to clipboard', { error: e })
	}
}
</script>

<style scoped lang="scss">
.share-confirmation {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: calc(var(--default-grid-baseline) * 3);
	padding-block: calc(var(--default-grid-baseline) * 3);
	text-align: center;

	&__icon {
		color: var(--color-success);
	}

	&__title {
		margin: 0;
		font-size: 1.2em;
	}

	&__qr {
		border-radius: var(--border-radius-element);
	}

	&__link {
		display: flex;
		align-items: flex-end;
		gap: var(--default-grid-baseline);
		width: 100%;

		&-input {
			flex: 1 1 auto;
		}
	}

	&__done {
		align-self: stretch;
	}
}
</style>
