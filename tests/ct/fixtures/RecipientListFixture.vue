<!--
  SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
  SPDX-License-Identifier: GPL-3.0-or-later
-->
<template>
	<RecipientList :share="share" />
</template>

<script setup lang="ts">
import type { Share } from '../../../lib/dialog/api/share.ts'
import type { SharingRecipient } from '../../../lib/dialog/types/api.ts'

import { reactive } from 'vue'
import RecipientList from '../../../lib/dialog/components/RecipientList.vue'
import { RECIPIENT_TYPE_GROUP, RECIPIENT_TYPE_TOKEN, RECIPIENT_TYPE_USER } from '../../../lib/dialog/constants.ts'

function recipient(cls: string, value: string, displayName: string): SharingRecipient {
	return {
		class: cls,
		value,
		instance: null,
		display_name: displayName,
		icon: null,
		secret: { updatable: false },
		initiator: null,
		permission_preset: null,
		permissions: [],
	}
}

const share = reactive({
	recipients: [
		recipient(RECIPIENT_TYPE_USER, 'alice', 'Alice'),
		recipient(RECIPIENT_TYPE_GROUP, 'devs', 'Devs'),
		// A link (token) recipient must NOT be listed here.
		recipient(RECIPIENT_TYPE_TOKEN, 'tok', 'Public link'),
	],
	permissions: [],
	permissionPreset: null,
	data: { owner: { user_id: 'me', instance: null, display_name: 'Me', icon: { svg: '' } } },
	async removeRecipient() {},
	async selectRecipientPreset() {},
	async setRecipientPermission() {},
}) as unknown as Share
</script>
