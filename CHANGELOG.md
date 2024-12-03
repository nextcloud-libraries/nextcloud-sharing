<!--
  - SPDX-FileCopyrightText: 2021 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: GPL-3.0-or-later
-->

# Changelog

All notable changes to this project will be documented in this file.

## 0.2.4 - 2024-12-03

### Added

-   feat: Add `ScienceMesh` shareType

### Changed

-   Add SPDX license information header

## 0.2.3 - 2024-07-24

### Fixed

-   fix: Typo in `ShareType.Group`

### Changed

-   Add SPDX license information header

## 0.2.2 - 2024-06-20

### Fixed

-   fix: Do not add `default` export specifier

## 0.2.1 - 2024-06-20

### Fixed

-   fix: Correctly add exports of `public` entry point \([\#30](https://github.com/nextcloud-libraries/nextcloud-sharing/pull/30)\)
-   fix: Do not include test files in `dist` \([\#27](https://github.com/nextcloud-libraries/nextcloud-sharing/pull/27)\)

### Changed

-   ci: Add prettier also to CI \([\#27](https://github.com/nextcloud-libraries/nextcloud-sharing/pull/29)\)
-   chore: Fix docs to correctly name `public` module \([\#28](https://github.com/nextcloud-libraries/nextcloud-sharing/pull/28)\)

## 0.2.0 - 2024-06-19

### Added

-   Add federated_group share type \([\#13](https://github.com/nextcloud-libraries/nextcloud-sharing/pull/13)\)
-   feat: Add `ShareType` enum to replace `Type` with more JS native naming \([\#22](https://github.com/nextcloud-libraries/nextcloud-sharing/pull/22)\)
-   feat: Add utils for public link shares \([\#24](https://github.com/nextcloud-libraries/nextcloud-sharing/pull/24)\)

### Changed

-   Refactor: Use Vite, Vitest add ESLint and Prettier \([\#21](https://github.com/nextcloud-libraries/nextcloud-sharing/pull/21)\)
-   chore: update node engines to next LTS (v20)
-   chore: Add CI to block unconventional commits
-   chore: Update workflows from organization

## 0.1.0 - 2021-08-18

### Added

-   Initial implementation
