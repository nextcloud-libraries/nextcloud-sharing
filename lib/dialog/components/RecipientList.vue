<!--
  SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
  SPDX-License-Identifier: GPL-3.0-or-later
-->
<template>
	<ul v-if="recipients.length > 0" class="recipient-list">
		<RecipientRow
			v-for="recipient in recipients"
			:key="recipient.class + recipient.value + (recipient.instance ?? '')"
			:share="share"
			:recipient="recipient" />
	</ul>
</template>

<script setup lang="ts">
import type { Share } from '../api/share.ts'

import { computed } from 'vue'
import RecipientRow from './RecipientRow.vue'
import { RECIPIENT_TYPE_TOKEN } from '../constants.ts'

const props = defineProps<{
	/** The share being edited */
	share: Share
}>()

// Link (token) recipients are managed by the "Anyone" tab, not listed here.
const recipients = computed(() => props.share.recipients.filter((recipient) => recipient.class !== RECIPIENT_TYPE_TOKEN))
</script>

<style scoped lang="scss">
.recipient-list {
	display: flex;
	flex-direction: column;
	gap: calc(var(--default-grid-baseline) * 3);
	padding-inline-start: calc(var(--default-grid-baseline) * 2);
}
</style>
