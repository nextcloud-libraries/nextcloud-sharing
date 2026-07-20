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

```ts
import { openSharingDialog, isSharingDialogAvailable } from '@nextcloud/sharing/dialog'

if (isSharingDialogAvailable()) {
    await openSharingDialog(node)
}
```

The entry point also exports the `SharingDialog` component for embedding, a
typed client for the sharing API (`createShare`, `addShareRecipient`,
`selectSharePermissionPreset`, ...) and all its request/response types.
