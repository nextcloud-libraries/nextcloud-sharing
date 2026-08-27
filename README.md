<!--
  - SPDX-FileCopyrightText: 2021 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: GPL-3.0-or-later
-->

# `@nextcloud/sharing`

[![REUSE status](https://api.reuse.software/badge/github.com/nextcloud-libraries/nextcloud-sharing)](https://api.reuse.software/info/github.com/nextcloud-libraries/nextcloud-sharing)
[![npm](https://img.shields.io/npm/v/@nextcloud/sharing.svg)](https://www.npmjs.com/package/@nextcloud/sharing)

Common front-end utils for files sharing on Nextcloud and Nextcloud apps.

## Installation

```
npm i -S @nextcloud/sharing
```

## Usage

There are three entry points provided:

- The main entry point `@nextcloud/sharing` provides general utils for file sharing
- The _public_ entry point `@nextcloud/sharing/public` provides utils for handling public file shares
- The _ui_ entry point `@nextcloud/sharing/ui` provides API bindings to interact with the files sharing interface in the files app.
- The _dialog_ entry point `@nextcloud/sharing/dialog` provides the sharing dialog for the unified sharing API (**experimental**, see below).

### Sharing dialog (experimental)

> [!WARNING]
> This entry point is experimental. It requires the unified sharing API
> (Nextcloud 35 or later) and its API may change in any minor release.
> Some inline validation requires a not-yet-released `@nextcloud/vue` version
> and degrades gracefully on older ones.

Open the dialog for a node:

```ts
import { openSharingDialog, isSharingDialogAvailable } from '@nextcloud/sharing/dialog'

// Safe to call directly: shows an error toast if the API is unavailable
await openSharingDialog(node)

// Or gate your entry point (e.g. a share button) on availability:
if (isSharingDialogAvailable()) {
    // show the share action
}
```

For programmatic control, work with a `Share` instance directly. Instances are
created by `createShare()` (a new draft) or `getShare()` (an existing share) —
the `Share` class is exported as a type only and is never constructed manually.
Every mutation round-trips to the backend and updates the reactive instance:

```ts
import { createShare, getShare, searchRecipients } from '@nextcloud/sharing/dialog'
import type { Share } from '@nextcloud/sharing/dialog'

const share = await createShare()
await share.addNode(node)
await share.selectPreset(presetClass)
await share.setProperty(propertyClass, value)
await share.showDialog(node) // open the dialog bound to this share

const existing: Share = await getShare(shareId)
const recipients = await searchRecipients('alice')
```

The entry point also exports the `SharingDialog` component for embedding and all
of the sharing API's request/response types.
