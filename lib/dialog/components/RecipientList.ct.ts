/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { expect, test } from '@playwright/experimental-ct-vue'
import Fixture from '../../../tests/ct/fixtures/RecipientListFixture.vue'

test('renders a row per recipient, excluding the link (token)', async ({ mount }) => {
	const component = await mount(Fixture)
	await expect(component.getByText('Alice')).toBeVisible()
	await expect(component.getByText('Devs')).toBeVisible()
	// The token recipient is managed by the "Anyone" tab, not listed here.
	await expect(component.getByText('Public link')).toHaveCount(0)
	await expect(component.locator('.recipient-row')).toHaveCount(2)
})
