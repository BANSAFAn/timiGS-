# Changelog

## [1.21.0](https://github.com/BANSAFAn/timiGS-/compare/v1.20.0...v1.21.0) (2026-01-25)


### Features

* add voice controls (mute, device selection), redesign goal selector with card UI ([21be353](https://github.com/BANSAFAn/timiGS-/commit/21be3533c815410c5e39dd7e1612bba8d8eee154))
* Docs ([7614010](https://github.com/BANSAFAn/timiGS-/commit/7614010c1f7533dec3035cc6e27444cba7506507))
* implement mobile google auth logic (deep links) ([6dfb715](https://github.com/BANSAFAn/timiGS-/commit/6dfb715e62a2ae5fc59c14387c6d9bba0a46d52b))
* New site ! ([bdc4194](https://github.com/BANSAFAn/timiGS-/commit/bdc4194988741395bb997f18093524d7c2f5fdb9))
* New Tab TEAMS ([fd408a6](https://github.com/BANSAFAn/timiGS-/commit/fd408a67a5e182ae6cf32c1d4f9f8743305113ed))
* setup android deep links and fix icons via CI scripts ([5427a6e](https://github.com/BANSAFAn/timiGS-/commit/5427a6eb508fbfb1e1c5612ea1bbf03ec5521d66))
* weather tab menu :3 ([65fd6ec](https://github.com/BANSAFAn/timiGS-/commit/65fd6ec5c6c8d28cba81a7a82350b1011bb66239))


### Bug Fixes

* ci workflow syntax error ([2992834](https://github.com/BANSAFAn/timiGS-/commit/2992834ed9827a64f329b62a4905ced2d1272ca3))
* convert signing script to ESM to resolve CI module error ([8eb5e8f](https://github.com/BANSAFAn/timiGS-/commit/8eb5e8f2bced0b688e0699be6ed4d06d6615a702))
* ensure android release builds are signed with debug key to fix installation issues ([3158e6e](https://github.com/BANSAFAn/timiGS-/commit/3158e6eabdd1a45bae6b7172d80d953977341168))
* Icon ([cc32ec9](https://github.com/BANSAFAn/timiGS-/commit/cc32ec9d9b34f3f52a8980fd841ea5948dac7500))
* lib & picker ([da15ee7](https://github.com/BANSAFAn/timiGS-/commit/da15ee7ba07da12cab66ad738063045eebefc245))
* lower Android minSdkVersion from 30 to 24 for wider device support ([b5bd428](https://github.com/BANSAFAn/timiGS-/commit/b5bd428e20d972220e2dd84f0b43ad072bf47489))
* mobile trans ([16ad439](https://github.com/BANSAFAn/timiGS-/commit/16ad4390f432967cb1279d6c238993127f25f96f))
* mobile ui (hide menu labels), reactive theme toggle ([7e4f67e](https://github.com/BANSAFAn/timiGS-/commit/7e4f67e7213130376f16f811034f0576f5760e94))
* patch ([7f1d5ef](https://github.com/BANSAFAn/timiGS-/commit/7f1d5ef02867a7e7489ff2151540a87f1011ed7d))
* patch 2.3 ([867ef91](https://github.com/BANSAFAn/timiGS-/commit/867ef91193c1ad0e8568d6750d028e15ecfb45a5))
* patch-manifest script esm and deep-link ts types ([4fbdf45](https://github.com/BANSAFAn/timiGS-/commit/4fbdf4509e31da0686cc78675a6cce519963314f))
* regenerate icons in RGBA format for Tauri ([1f925dd](https://github.com/BANSAFAn/timiGS-/commit/1f925ddd6e7370352a6d51b5e1e89273e8cd7bab))
* resolve TypeScript errors in Compare.vue and teams.ts ([d197bef](https://github.com/BANSAFAn/timiGS-/commit/d197befe32f5bc99fa4a119c082c7ef746fb42bf))
* use correct login_google command for Google Auth in Teams ([7170d7b](https://github.com/BANSAFAn/timiGS-/commit/7170d7b87a82991e63eb196f1dbec7aa84c95276))


### Styles

* New style Weather, Transfer, Weather ([735d171](https://github.com/BANSAFAn/timiGS-/commit/735d171c728c905e817487aafa2554208f48a425))
* Settings ([05314bd](https://github.com/BANSAFAn/timiGS-/commit/05314bd054d8167ec9334748931c7cbfa8d65c2b))


### CI/CD

* build fix & teams call ([1047f92](https://github.com/BANSAFAn/timiGS-/commit/1047f92de41ed42ebf713d00c7bc4bde8358309c))


### Build System

* **deps:** bump devalue ([08fbc07](https://github.com/BANSAFAn/timiGS-/commit/08fbc075b4a7fd50ccf7eee4a0ca9acbaa18b817))
* **deps:** bump react-router ([761f0a7](https://github.com/BANSAFAn/timiGS-/commit/761f0a71e2e5556023af567bd1c79ec53c25c8b0))

## [1.20.0](https://github.com/BANSAFAn/timiGS-/compare/v1.19.0...v1.20.0) (2026-01-06)


### Features

* Add documentation viewer and docs navigation ([27a4f88](https://github.com/BANSAFAn/timiGS-/commit/27a4f884187bad57f3148729d8cbf4c30022e195))
* Add file transfer features and P2P transfer view ([5a31bbb](https://github.com/BANSAFAn/timiGS-/commit/5a31bbb06fa3a261b9b5208763077e09a62a348c))
* Add mandatory attribution and license info to UI ([85cf147](https://github.com/BANSAFAn/timiGS-/commit/85cf14721abda883bec8225d8f6367fb6cd79410))
* Add multi-cloud account support and Drive export features ([4075e74](https://github.com/BANSAFAn/timiGS-/commit/4075e74389f2e58ab1b261dc428cf0a14a53c8c2))
* add new website design ([c925c16](https://github.com/BANSAFAn/timiGS-/commit/c925c16086b3a696940789268826b4a742989a0a))
* Add task title filter and improve Google Drive backup ([733066a](https://github.com/BANSAFAn/timiGS-/commit/733066a4124ad48ae1642ac4614c9b16299e71d6))
* Add tasks and goals tracking feature ([45194b6](https://github.com/BANSAFAn/timiGS-/commit/45194b61241e31cb518668489249719b36729e60))
* Create LICENSE ([85641d4](https://github.com/BANSAFAn/timiGS-/commit/85641d4249b249bbd4fde6eec6590a65373435b0))
* fix Settings.vue ([a90f9b5](https://github.com/BANSAFAn/timiGS-/commit/a90f9b52ded56a8b2e205bc572959b49f4bd21b6))
* style format rust code ([81daed6](https://github.com/BANSAFAn/timiGS-/commit/81daed665df6d4b4bfb8f48a32912c3c09839175))
* transfer ([8623dae](https://github.com/BANSAFAn/timiGS-/commit/8623daed401b16d4a94a8994244380675548640b))
* update release ([bb67b9d](https://github.com/BANSAFAn/timiGS-/commit/bb67b9da13b4ca15a792fc065c51254b07058227))


### Bug Fixes

* Refactor icons, add icon fix script, and minor code cleanup ([6f1181b](https://github.com/BANSAFAn/timiGS-/commit/6f1181bed7721617bb0b78820ed2aa2336c3d005))
* Settings.vue ([514d7c1](https://github.com/BANSAFAn/timiGS-/commit/514d7c125298b533e5b33faf6ba6aec08c15f8c4))
* tracker.rs (show icon more) ([a5bacc9](https://github.com/BANSAFAn/timiGS-/commit/a5bacc9fdb81e021983ea5542e6fe7f49485f008))


### CI/CD

* realese please fixing ([ccaa86b](https://github.com/BANSAFAn/timiGS-/commit/ccaa86b3a96e0be24ac5bfbd6c618dac07d672da))


### Build System

* fix tauri ico ([f9c9be6](https://github.com/BANSAFAn/timiGS-/commit/f9c9be6a1feb7e5012ebd63d028c7b537bf8adfe))

## [1.19.0](https://github.com/BANSAFAn/timiGS-/compare/v1.18.0...v1.19.0) (2026-01-02)


### Features

* add discord rpc and refine timeline ([8686548](https://github.com/BANSAFAn/timiGS-/commit/86865488ce86c0025aebf30c0fbdfa3991a14527))


### Bug Fixes

* add debug dialogs for windows crash ([360e8ab](https://github.com/BANSAFAn/timiGS-/commit/360e8abe683e7b5ead9ba8db7068a53374307e76))
* remove invalid autostart config to resolve crash ([db32c63](https://github.com/BANSAFAn/timiGS-/commit/db32c6302482d08d87d729217ecbb3e6ddc99005))

## [1.18.0](https://github.com/BANSAFAn/timiGS-/compare/v1.17.1...v1.18.0) (2025-12-30)


### Features

* add Android build support and fix Windows CI ([5b07565](https://github.com/BANSAFAn/timiGS-/commit/5b0756512fe9993adcaca9dd18986aa76b8b8106))
* **ci:** add security audit and lint checks to PR workflow ([d0cc889](https://github.com/BANSAFAn/timiGS-/commit/d0cc889881a1b519654635ff5fa7f2d6bef1a0d9))

## [1.17.1](https://github.com/BANSAFAn/timiGS-/compare/v1.17.0...v1.17.1) (2025-12-30)


### Bug Fixes

* **app:** enable autostart plugin and add portable ZIP bundle ([7361d43](https://github.com/BANSAFAn/timiGS-/commit/7361d43084ac0eab153e822b3732a5f7189b5f98))

## [1.17.0](https://github.com/BANSAFAn/timiGS-/compare/v1.16.0...v1.17.0) (2025-12-22)


### Features

* multi-note Notepad, complete translations for all locales ([4b8ce67](https://github.com/BANSAFAn/timiGS-/commit/4b8ce6768d12be8a01de5a2613c00e70bd8f8554))
* redesign Analytics/Tools, add Notepad and in-app updater ([ceb0a8a](https://github.com/BANSAFAn/timiGS-/commit/ceb0a8aed887c73838cc2e8d74e4d04384b2cc19))
* **site:** migrate website from React to Astro ([360d237](https://github.com/BANSAFAn/timiGS-/commit/360d237806c101190cd1c2447438d3b49c8e95fd))


### Bug Fixes

* **build:** limit glib dependency to linux target only ([d3d7c18](https://github.com/BANSAFAn/timiGS-/commit/d3d7c18713bb780435d5ac7642199b8512b73c36))
* global layout full width (remove max-width), fix Analytics/Tools grid filling ([f831b6a](https://github.com/BANSAFAn/timiGS-/commit/f831b6abd5cb252343d3f1f025221c556dad7c2f))
* Tools layout horizontal, add missing UK timeline translations ([3f1ae14](https://github.com/BANSAFAn/timiGS-/commit/3f1ae145209a3460eafe5a4ba2a96cfabadefcf7))

## [1.16.0](https://github.com/BANSAFAn/timiGS-/compare/v1.15.0...v1.16.0) (2025-12-21)


### Features

* add French and Simplified Chinese localization ([65a2113](https://github.com/BANSAFAn/timiGS-/commit/65a21135a80bf6d4f6c2ff3eafb13f6cefb8d525))
* improve timeline, browser tracking, and installer design ([9d01da5](https://github.com/BANSAFAn/timiGS-/commit/9d01da589c3aec67b0cc703f5e7069d8f9dbaa44))

## [1.15.0](https://github.com/BANSAFAn/timiGS-/compare/v1.14.0...v1.15.0) (2025-12-21)


### Features

* add email weekly reports feature ([674f4a6](https://github.com/BANSAFAn/timiGS-/commit/674f4a64bdb14a3af1e006db33e38e850b3f32f4))
* add GitHub activity tracking tab ([8ff91c7](https://github.com/BANSAFAn/timiGS-/commit/8ff91c7eccf48ae803ddef5a9075acfc983cbcc7))
* add local builder and manual ci trigger ([807bc95](https://github.com/BANSAFAn/timiGS-/commit/807bc95521ca0d96a9c80afea7ac3e6b69693c80))
* add PR CI checks and conditional GitHub nav ([914ad66](https://github.com/BANSAFAn/timiGS-/commit/914ad6667e5622c320d63c4bbfc86037ca28187c))
* add tools tab, fix alignment, and setup ci/cd ([14215c8](https://github.com/BANSAFAn/timiGS-/commit/14215c869fe662bf2f4f6c8324f7e13c6620a396))
* add tools tab, fix alignment, and setup ci/cd ([1efa1be](https://github.com/BANSAFAn/timiGS-/commit/1efa1be7f8a62fa11f690a365a26bb004fa0ca2b))
* add tools tab, fix alignment, and setup ci/cd ([23d1dd0](https://github.com/BANSAFAn/timiGS-/commit/23d1dd0942f7cd53c62a87f0d456a99646df37f4))
* add tools tab, fix alignment, and setup ci/cd ([72f1efd](https://github.com/BANSAFAn/timiGS-/commit/72f1efd65068e0287bca679ce75b743ad79a9c7b))
* add tools tab, fix alignment, and setup ci/cd ([08b5b72](https://github.com/BANSAFAn/timiGS-/commit/08b5b723a62ab8f6394a988752504c732c4bc923))
* add tools tab, fix alignment, and setup ci/cd ([e3ce917](https://github.com/BANSAFAn/timiGS-/commit/e3ce917705745596c01ced43bd4b5e14585cbfbe))
* add tools tab, fix alignment, and setup ci/cd ([fb05473](https://github.com/BANSAFAn/timiGS-/commit/fb054739ac260d9488cf5098c916a213f4b99779))
* add tools tab, fix alignment, and setup ci/cd ([d36fc9e](https://github.com/BANSAFAn/timiGS-/commit/d36fc9ed42f37b8a120a60d4f0596e5bc675c851))
* consolidate release and build workflows ([6b24454](https://github.com/BANSAFAn/timiGS-/commit/6b2445417deb424d39eb17deca5903f771ead27d))
* localize analytics detail view ([4952029](https://github.com/BANSAFAn/timiGS-/commit/4952029b3b4853dfe2a355a0074fdc669bb4d355))
* remove global width constraints and fix grid layouts ([72f5cec](https://github.com/BANSAFAn/timiGS-/commit/72f5cecc5adadd749051dae0a3b05a1f768e83de))
* update publisher and widen UI layout ([35fc50c](https://github.com/BANSAFAn/timiGS-/commit/35fc50cc3b57785f5f16be193c3f410b0e3d6bb2))


### Bug Fixes

* add all bundle targets and release-please manifest config ([9eb15e1](https://github.com/BANSAFAn/timiGS-/commit/9eb15e1fa43e0540c15518b31b1675b89a0c0ae4))
* correct release-please manifest format ([192b4a4](https://github.com/BANSAFAn/timiGS-/commit/192b4a488c47b8b89e701c17dd06fe9d3b899714))
* remove duplicate import ([2ae824e](https://github.com/BANSAFAn/timiGS-/commit/2ae824e8baad1cdedf695a66e52de31509e84de8))
* remove empty space in Analytics layout and style email section ([f100f77](https://github.com/BANSAFAn/timiGS-/commit/f100f77f757d035f6b808853451a8225aed5d074))
* remove unused imports and fix publisher for WiX ([cbed956](https://github.com/BANSAFAn/timiGS-/commit/cbed9562fa945cb1bd47c040ee0ffba7748f0bd4))
* update stats-grid to 3-column layout ([652f1f4](https://github.com/BANSAFAn/timiGS-/commit/652f1f4153b19557ea44112d2506cdb7fae39ff5))

## [1.13.0](https://github.com/BANSAFAn/timiGS-/compare/v1.12.0...v1.13.0) (2025-12-20)


### Features

* add email weekly reports feature ([674f4a6](https://github.com/BANSAFAn/timiGS-/commit/674f4a64bdb14a3af1e006db33e38e850b3f32f4))
* add local builder and manual ci trigger ([807bc95](https://github.com/BANSAFAn/timiGS-/commit/807bc95521ca0d96a9c80afea7ac3e6b69693c80))
* add tools tab, fix alignment, and setup ci/cd ([14215c8](https://github.com/BANSAFAn/timiGS-/commit/14215c869fe662bf2f4f6c8324f7e13c6620a396))
* add tools tab, fix alignment, and setup ci/cd ([1efa1be](https://github.com/BANSAFAn/timiGS-/commit/1efa1be7f8a62fa11f690a365a26bb004fa0ca2b))
* add tools tab, fix alignment, and setup ci/cd ([23d1dd0](https://github.com/BANSAFAn/timiGS-/commit/23d1dd0942f7cd53c62a87f0d456a99646df37f4))
* add tools tab, fix alignment, and setup ci/cd ([72f1efd](https://github.com/BANSAFAn/timiGS-/commit/72f1efd65068e0287bca679ce75b743ad79a9c7b))
* add tools tab, fix alignment, and setup ci/cd ([08b5b72](https://github.com/BANSAFAn/timiGS-/commit/08b5b723a62ab8f6394a988752504c732c4bc923))
* add tools tab, fix alignment, and setup ci/cd ([e3ce917](https://github.com/BANSAFAn/timiGS-/commit/e3ce917705745596c01ced43bd4b5e14585cbfbe))
* add tools tab, fix alignment, and setup ci/cd ([fb05473](https://github.com/BANSAFAn/timiGS-/commit/fb054739ac260d9488cf5098c916a213f4b99779))
* add tools tab, fix alignment, and setup ci/cd ([d36fc9e](https://github.com/BANSAFAn/timiGS-/commit/d36fc9ed42f37b8a120a60d4f0596e5bc675c851))
* consolidate release and build workflows ([6b24454](https://github.com/BANSAFAn/timiGS-/commit/6b2445417deb424d39eb17deca5903f771ead27d))
* localize analytics detail view ([4952029](https://github.com/BANSAFAn/timiGS-/commit/4952029b3b4853dfe2a355a0074fdc669bb4d355))
* remove global width constraints and fix grid layouts ([72f5cec](https://github.com/BANSAFAn/timiGS-/commit/72f5cecc5adadd749051dae0a3b05a1f768e83de))
* update publisher and widen UI layout ([35fc50c](https://github.com/BANSAFAn/timiGS-/commit/35fc50cc3b57785f5f16be193c3f410b0e3d6bb2))


### Bug Fixes

* remove duplicate import ([2ae824e](https://github.com/BANSAFAn/timiGS-/commit/2ae824e8baad1cdedf695a66e52de31509e84de8))
* remove unused imports and fix publisher for WiX ([cbed956](https://github.com/BANSAFAn/timiGS-/commit/cbed9562fa945cb1bd47c040ee0ffba7748f0bd4))
* update stats-grid to 3-column layout ([652f1f4](https://github.com/BANSAFAn/timiGS-/commit/652f1f4153b19557ea44112d2506cdb7fae39ff5))

## [1.8.0](https://github.com/BANSAFAn/timiGS-/compare/v1.7.0...v1.8.0) (2025-12-20)


### Features

* consolidate release and build workflows ([6b24454](https://github.com/BANSAFAn/timiGS-/commit/6b2445417deb424d39eb17deca5903f771ead27d))

## [1.7.0](https://github.com/BANSAFAn/timiGS-/compare/v1.6.0...v1.7.0) (2025-12-20)


### Features

* add tools tab, fix alignment, and setup ci/cd ([14215c8](https://github.com/BANSAFAn/timiGS-/commit/14215c869fe662bf2f4f6c8324f7e13c6620a396))
* add tools tab, fix alignment, and setup ci/cd ([1efa1be](https://github.com/BANSAFAn/timiGS-/commit/1efa1be7f8a62fa11f690a365a26bb004fa0ca2b))
* add tools tab, fix alignment, and setup ci/cd ([23d1dd0](https://github.com/BANSAFAn/timiGS-/commit/23d1dd0942f7cd53c62a87f0d456a99646df37f4))
* add tools tab, fix alignment, and setup ci/cd ([72f1efd](https://github.com/BANSAFAn/timiGS-/commit/72f1efd65068e0287bca679ce75b743ad79a9c7b))
* add tools tab, fix alignment, and setup ci/cd ([08b5b72](https://github.com/BANSAFAn/timiGS-/commit/08b5b723a62ab8f6394a988752504c732c4bc923))
* add tools tab, fix alignment, and setup ci/cd ([e3ce917](https://github.com/BANSAFAn/timiGS-/commit/e3ce917705745596c01ced43bd4b5e14585cbfbe))
* add tools tab, fix alignment, and setup ci/cd ([fb05473](https://github.com/BANSAFAn/timiGS-/commit/fb054739ac260d9488cf5098c916a213f4b99779))
* add tools tab, fix alignment, and setup ci/cd ([d36fc9e](https://github.com/BANSAFAn/timiGS-/commit/d36fc9ed42f37b8a120a60d4f0596e5bc675c851))
* localize analytics detail view ([4952029](https://github.com/BANSAFAn/timiGS-/commit/4952029b3b4853dfe2a355a0074fdc669bb4d355))
* remove global width constraints and fix grid layouts ([72f5cec](https://github.com/BANSAFAn/timiGS-/commit/72f5cecc5adadd749051dae0a3b05a1f768e83de))

## [1.5.0](https://github.com/BANSAFAn/timiGS-/compare/v1.4.0...v1.5.0) (2025-12-19)


### Features

* add tools tab, fix alignment, and setup ci/cd ([14215c8](https://github.com/BANSAFAn/timiGS-/commit/14215c869fe662bf2f4f6c8324f7e13c6620a396))
* add tools tab, fix alignment, and setup ci/cd ([1efa1be](https://github.com/BANSAFAn/timiGS-/commit/1efa1be7f8a62fa11f690a365a26bb004fa0ca2b))
* add tools tab, fix alignment, and setup ci/cd ([23d1dd0](https://github.com/BANSAFAn/timiGS-/commit/23d1dd0942f7cd53c62a87f0d456a99646df37f4))
* add tools tab, fix alignment, and setup ci/cd ([72f1efd](https://github.com/BANSAFAn/timiGS-/commit/72f1efd65068e0287bca679ce75b743ad79a9c7b))
* add tools tab, fix alignment, and setup ci/cd ([08b5b72](https://github.com/BANSAFAn/timiGS-/commit/08b5b723a62ab8f6394a988752504c732c4bc923))
* add tools tab, fix alignment, and setup ci/cd ([e3ce917](https://github.com/BANSAFAn/timiGS-/commit/e3ce917705745596c01ced43bd4b5e14585cbfbe))
* add tools tab, fix alignment, and setup ci/cd ([fb05473](https://github.com/BANSAFAn/timiGS-/commit/fb054739ac260d9488cf5098c916a213f4b99779))
* add tools tab, fix alignment, and setup ci/cd ([d36fc9e](https://github.com/BANSAFAn/timiGS-/commit/d36fc9ed42f37b8a120a60d4f0596e5bc675c851))

## [1.1.0](https://github.com/BANSAFAn/timiGS-/compare/v1.0.0...v1.1.0) (2025-12-16)


### Features

* add tools tab, fix alignment, and setup ci/cd ([fb05473](https://github.com/BANSAFAn/timiGS-/commit/fb054739ac260d9488cf5098c916a213f4b99779))
* add tools tab, fix alignment, and setup ci/cd ([d36fc9e](https://github.com/BANSAFAn/timiGS-/commit/d36fc9ed42f37b8a120a60d4f0596e5bc675c851))
