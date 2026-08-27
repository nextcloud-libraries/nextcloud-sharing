/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { expect, test } from '@playwright/experimental-ct-vue'
import Fixture from '../../../tests/ct/fixtures/RecipientRowFixture.vue'

test('shows the recipient name and a static preset subtitle', async ({ mount }) => {
	const component = await mount(Fixture)
	await expect(component.getByText('alice')).toBeVisible()
	// No preset matches an empty share max → "Custom permissions".
	await expect(component.locator('.recipient-row__subtitle')).toHaveText('Custom permissions')
})

test('removes the recipient from the menu', async ({ mount, page }) => {
	let removed = false
	const onRemoved = () => {
		removed = true
	}
	const component = await mount(Fixture, { on: { removed: onRemoved } })
	await component.getByRole('button', { name: 'Recipient actions' }).click()
	await page.getByRole('menuitem', { name: 'Remove' }).click()
	expect(removed).toBe(true)
})

test('opens the custom permissions modal from the menu', async ({ mount, page }) => {
	const component = await mount(Fixture)
	await component.getByRole('button', { name: 'Recipient actions' }).click()
	await page.getByRole('menuitem', { name: 'Custom permissions' }).click()
	await expect(page.getByRole('dialog')).toBeVisible()
})
