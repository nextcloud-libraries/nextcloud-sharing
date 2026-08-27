<!--
  SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
  SPDX-License-Identifier: GPL-3.0-or-later
-->
<template>
	<ul>
		<RecipientRow :share="share" :recipient="recipient" />
	</ul>
</template>

<script setup lang="ts">
import type { Share } from '../../../lib/dialog/api/share.ts'
import type { SharingRecipient } from '../../../lib/dialog/types/api.ts'

import { reactive } from 'vue'
import RecipientRow from '../../../lib/dialog/components/RecipientRow.vue'
import { RECIPIENT_TYPE_USER } from '../../../lib/dialog/constants.ts'

const emit = defineEmits<{
	(e: 'removed'): void
}>()

const recipient: SharingRecipient = {
	class: RECIPIENT_TYPE_USER,
	value: 'alice',
	instance: null,
	display_name: 'alice',
	icon: null,
	secret: { updatable: false },
	initiator: null,
	permission_preset: null,
	permissions: [],
}

const share = reactive({
	recipients: [recipient],
	permissions: [],
	permissionPreset: null,
	data: { owner: { user_id: 'me', instance: null, display_name: 'Me', icon: { svg: '' } } },
	async removeRecipient() {
		emit('removed')
	},
	async selectRecipientPreset() {},
	async setRecipientPermission() {},
}) as unknown as Share
</script>
