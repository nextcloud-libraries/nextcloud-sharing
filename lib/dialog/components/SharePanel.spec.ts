/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import type { Share } from '../api/share.ts'
import type { SharingShare } from '../types/api.ts'

import { flushPromises, shallowMount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import SharePanel from './SharePanel.vue'
import { PROPERTY_EXPIRATION, PROPERTY_PASSWORD, RECIPIENT_TYPE_TOKEN, RECIPIENT_TYPE_USER, SOURCE_TYPE_NODE } from '../constants.ts'
import { ShareDialogTab } from '../types/ui.ts'

const PRESET_VIEW = 'preset-view'
const PRESET_EDIT = 'preset-edit'
const PERM_READ = 'perm-read'
const PERM_WRITE = 'perm-write'

vi.mock('@nextcloud/capabilities', () => ({
	getCapabilities: () => ({
		sharing: {
			permission_presets: [
				{ class: PRESET_VIEW, display_name: 'Can view', hint: null },
				{ class: PRESET_EDIT, display_name: 'Can edit', hint: null },
			],
		},
	}),
}))

vi.mock('@nextcloud/router', () => ({
	generateUrl: (url: string, params: Record<string, string>) => url.replace(/\{(\w+)\}/g, (_, k) => params[k]),
}))

vi.mock('../api/share.ts', () => ({
	searchRecipients: vi.fn().mockResolvedValue([]),
}))

// Confirm dialog: always answer with the last button ("Continue").
vi.mock('@nextcloud/dialogs', () => ({
	DialogBuilder: class {
		buttons: { callback: () => void }[] = []
		setName() {
			return this
		}

		setText() {
			return this
		}

		setButtons(buttons: { callback: () => void }[]) {
			this.buttons = buttons
			return this
		}

		build() {
			const { buttons } = this
			return {
				show: async () => buttons.at(-1)?.callback(),
			}
		}
	},
}))

/**
 * Build a share schema.
 *
 * @param overrides Fields to override
 */
function schema(overrides: Partial<SharingShare> = {}): SharingShare {
	return {
		id: 'abc',
		owner: { user_id: 'alice', instance: null, display_name: 'Alice', icon: { svg: '' } },
		last_updated: 0,
		state: 'draft',
		sources: [{ class: SOURCE_TYPE_NODE, value: '42', display_name: 'file', icon: null }],
		recipients: [],
		properties: [],
		permissions: [
			{ class: PERM_READ, source_class: null, display_name: 'Read', hint: null, priority: 10, presets: [PRESET_VIEW, PRESET_EDIT], enabled: true },
			{ class: PERM_WRITE, source_class: null, display_name: 'Write', hint: null, priority: 20, presets: [PRESET_EDIT], enabled: false },
		],
		...overrides,
	}
}

interface FakeShare {
	setProperty: ReturnType<typeof vi.fn>
	setPermission: ReturnType<typeof vi.fn>
	selectPreset: ReturnType<typeof vi.fn>
	addRecipient: ReturnType<typeof vi.fn>
	removeRecipient: ReturnType<typeof vi.fn>
	activate: ReturnType<typeof vi.fn>
}

/**
 * Build a fake Share exposing the getters SharePanel reads and spy mutations.
 *
 * @param data The backing schema
 */
function fakeShare(data: SharingShare): Share & FakeShare {
	return {
		id: data.id,
		get data() { return data },
		get sources() { return data.sources },
		get recipients() { return data.recipients },
		get properties() { return data.properties },
		get permissions() { return data.permissions },
		get state() { return data.state },
		get permissionPreset() { return data.permission_preset },
		setProperty: vi.fn().mockResolvedValue(undefined),
		setPermission: vi.fn().mockResolvedValue(undefined),
		selectPreset: vi.fn().mockResolvedValue(undefined),
		addRecipient: vi.fn().mockResolvedValue(undefined),
		removeRecipient: vi.fn().mockResolvedValue(undefined),
		activate: vi.fn().mockResolvedValue(undefined),
	} as unknown as Share & FakeShare
}

/**
 * Mount SharePanel with a fake share.
 *
 * @param data The backing schema
 * @param props Extra props (tab, inSettings, folderName)
 */
function mountPanel(data: SharingShare = schema(), props: Record<string, unknown> = {}) {
	const share = fakeShare(data)
	const wrapper = shallowMount(SharePanel, {
		props: {
			share,
			shareDialogTab: ShareDialogTab.InvitedPeople,
			inSettings: false,
			...props,
		},
		// Render stub slots so note text and slotted toggles (inside NcFormBox) appear.
		global: { renderStubDefaultSlot: true },
	})
	return { wrapper, share }
}

beforeEach(() => {
	vi.clearAllMocks()
})

describe('SharePanel presets and permissions', () => {
	it('applies a preset on selection', async () => {
		const { wrapper, share } = mountPanel()
		wrapper.findComponent({ name: 'PermissionEditor' }).vm.$emit('presetChange', { value: PRESET_EDIT, label: 'Can edit' })
		await flushPromises()
		expect(share.selectPreset).toHaveBeenCalledWith(PRESET_EDIT)
	})

	it('does not call the backend when picking the custom entry', async () => {
		const { wrapper, share } = mountPanel()
		wrapper.findComponent({ name: 'PermissionEditor' }).vm.$emit('presetChange', { value: 'custom', label: 'Can…' })
		await flushPromises()
		expect(share.selectPreset).not.toHaveBeenCalled()
		// The editor is told to reveal the toggles in custom mode.
		expect(wrapper.findComponent({ name: 'PermissionEditor' }).props('showPermissions')).toBe(true)
	})

	it('toggles a single permission in custom mode', async () => {
		const { wrapper, share } = mountPanel(schema({ permission_preset: null }))
		const editor = wrapper.findComponent({ name: 'PermissionEditor' })
		const write = editor.props('permissions').find((p: { class: string }) => p.class === PERM_WRITE)
		editor.vm.$emit('permissionToggle', write, true)
		await flushPromises()
		expect(share.setPermission).toHaveBeenCalledWith(PERM_WRITE, true)
	})
})

describe('SharePanel tab bar', () => {
	const recipient = {
		class: RECIPIENT_TYPE_USER,
		value: 'bob',
		instance: null,
		display_name: 'Bob',
		icon: null,
		secret: { updatable: false },
		initiator: null,
		permissions: [],
	}

	it('shows the share-type tabs while the share is a draft', () => {
		expect(mountPanel().wrapper.findComponent({ name: 'NcRadioGroup' }).exists()).toBe(true)
		const withRecipient = mountPanel(schema({ recipients: [recipient] }))
		expect(withRecipient.wrapper.findComponent({ name: 'NcRadioGroup' }).exists()).toBe(true)
	})

	it('hides the share-type tabs once the share has been sent', () => {
		const { wrapper } = mountPanel(schema({ state: 'active' }))
		expect(wrapper.findComponent({ name: 'NcRadioGroup' }).exists()).toBe(false)
	})

	it('confirms and drops invited people when switching to the link tab', async () => {
		const { wrapper, share } = mountPanel(schema({ recipients: [recipient] }))
		wrapper.findComponent({ name: 'NcRadioGroup' }).vm.$emit('update:modelValue', ShareDialogTab.Anyone)
		await flushPromises()
		expect(share.removeRecipient).toHaveBeenCalledWith(RECIPIENT_TYPE_USER, 'bob', undefined)
	})
})

describe('SharePanel recipient sync', () => {
	it('adds a token recipient when opening on the Anyone tab', async () => {
		const { share } = mountPanel(schema(), { shareDialogTab: ShareDialogTab.Anyone })
		await flushPromises()
		expect(share.addRecipient).toHaveBeenCalledWith(RECIPIENT_TYPE_TOKEN, expect.any(String))
	})

	it('does not add a token recipient on the Invited tab', async () => {
		const { share } = mountPanel(schema(), { shareDialogTab: ShareDialogTab.InvitedPeople })
		await flushPromises()
		expect(share.addRecipient).not.toHaveBeenCalled()
	})
})

describe('SharePanel submit', () => {
	it('activates the share and emits submitted with the link', async () => {
		const { wrapper, share } = mountPanel(schema({ state: 'draft' }), { shareDialogTab: ShareDialogTab.InvitedPeople })
		wrapper.findComponent('.share-panel__link-send').vm.$emit('click')
		await flushPromises()
		expect(share.activate).toHaveBeenCalledOnce()
		const submitted = wrapper.emitted('submitted')
		expect(submitted).toHaveLength(1)
		expect(submitted![0][0]).toMatchObject({ isPublic: false })
	})
})

describe('SharePanel notes', () => {
	it('summarizes expiration and password when both are set', () => {
		const data = schema({
			properties: [
				{ class: PROPERTY_EXPIRATION, display_name: 'Expiration', hint: null, priority: 5, required: false, value: '2026-08-01T15:30:00+00:00', type: 'date' },
				{ class: PROPERTY_PASSWORD, display_name: 'Password', hint: null, priority: 6, required: false, value: 'secret', type: 'password' },
			],
		})
		const { wrapper } = mountPanel(data)
		expect(wrapper.text()).toContain('will expire on')
		expect(wrapper.text()).toContain('password protected')
	})

	it('shows no summary when neither expiration nor password is set', () => {
		const { wrapper } = mountPanel()
		expect(wrapper.text()).not.toContain('will expire on')
		expect(wrapper.text()).not.toContain('password protected')
	})

	it('hints about folder uploads on the Anyone tab for a folder', () => {
		const { wrapper } = mountPanel(schema(), { shareDialogTab: ShareDialogTab.Anyone, folderName: 'Photos' })
		expect(wrapper.text()).toContain('Photos')
		expect(wrapper.text()).toContain('will be added to')
	})

	it('does not hint about folder uploads on the Invited tab', () => {
		const { wrapper } = mountPanel(schema(), { shareDialogTab: ShareDialogTab.InvitedPeople, folderName: 'Photos' })
		expect(wrapper.text()).not.toContain('will be added to')
	})

	it('does not hint about folder uploads for a file (no folderName)', () => {
		const { wrapper } = mountPanel(schema(), { shareDialogTab: ShareDialogTab.Anyone, folderName: null })
		expect(wrapper.text()).not.toContain('will be added to')
	})
})
