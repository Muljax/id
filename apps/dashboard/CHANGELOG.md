# Changelog

## [1.10.1](https://github.com/Muljax/dashboard/compare/v1.10.0...v1.10.1) (2026-09-20)


### Bug Fixes

* **dashboard:** bind client profile selection to form state reactivity ([13a0173](https://github.com/Muljax/dashboard/commit/13a017358a10103d8704b6be0466fe33c43357f0))

## [1.10.0](https://github.com/Muljax/dashboard/compare/v1.9.0...v1.10.0) (2026-09-20)


### Features

* **auth:** integrate step-up biometric and password re-auth modal ([3eab949](https://github.com/Muljax/dashboard/commit/3eab9494a6bb4b7cd3f940b47f004f20676eb984))
* **step-up:** add requireElevation helper and wire to destructive actions ([ea74c0c](https://github.com/Muljax/dashboard/commit/ea74c0c25a2ba51b4da77c32229da5ab4e9ccac3))


### Bug Fixes

* **step-up:** remove stale ModalFooter import from StepUpContext ([6accdb8](https://github.com/Muljax/dashboard/commit/6accdb881e0c41e617861cbbe80e08e743fa9326))

## [1.9.0](https://github.com/Muljax/dashboard/compare/v1.8.0...v1.9.0) (2026-09-20)


### Features

* **passkeys:** add conditional autofill and passkey renaming UI ([42a9389](https://github.com/Muljax/dashboard/commit/42a938926e9ac4aeef7ff26e6c2e7406c76beee1))

## [1.8.0](https://github.com/Muljax/dashboard/compare/v1.7.0...v1.8.0) (2026-09-20)


### Features

* **security:** attach defense-in-depth security headers and CSP to worker ([7bf629b](https://github.com/Muljax/dashboard/commit/7bf629baf7d40ce4e0f282d1db91472492f0354c))

## [1.7.0](https://github.com/Muljax/dashboard/compare/v1.6.0...v1.7.0) (2026-09-20)


### Features

* **device:** add device activation and confirmation flow ([5951900](https://github.com/Muljax/dashboard/commit/595190033c4b742d760ffc9fdc448c2259a411a0))

## [1.6.0](https://github.com/Muljax/dashboard/compare/v1.5.0...v1.6.0) (2026-09-20)


### Features

* **dashboard:** add admin user session api client methods and query keys ([c80416e](https://github.com/Muljax/dashboard/commit/c80416e25d050707fc4f73cedfe644e815a66475))
* **dashboard:** add interactive sessions map, device management, and admin sessions modal ([961c6d9](https://github.com/Muljax/dashboard/commit/961c6d9cb1285f2cd2b5b6ec2c26d83c81ee2339))
* **dashboard:** standardize api client with direct schema types ([e14f98d](https://github.com/Muljax/dashboard/commit/e14f98dc16dd8a87051acbef234e0d00607771e7))

## [1.5.0](https://github.com/Muljax/dashboard/compare/v1.4.0...v1.5.0) (2026-09-19)


### Features

* **roles:** add custom ssh principal management UI to role modal ([e56a4f2](https://github.com/Muljax/dashboard/commit/e56a4f213350843efce402f14325be7ebc1d45c4))

## [1.4.0](https://github.com/Muljax/dashboard/compare/v1.3.0...v1.4.0) (2026-09-19)


### Features

* **ui:** autofocus first editable field when modal opens ([64af1d8](https://github.com/Muljax/dashboard/commit/64af1d83bd13613ac0dfce8a00ff83b7d45b8676))

## [1.3.0](https://github.com/Muljax/dashboard/compare/v1.2.1...v1.3.0) (2026-09-19)


### Features

* **ui:** support enter key submission across all modal dialogs ([9d3d0cb](https://github.com/Muljax/dashboard/commit/9d3d0cbbbcfa1d6126c2ed05611c34ba9ce75aa1))

## [1.2.1](https://github.com/Muljax/dashboard/compare/v1.2.0...v1.2.1) (2026-09-19)


### Bug Fixes

* **notifications:** connect SSE stream and suppress polling toast bursts ([4c0c358](https://github.com/Muljax/dashboard/commit/4c0c3586bcaf631f3d0d23fe67f49b7673ba4026))

## [1.2.0](https://github.com/Muljax/dashboard/compare/v1.1.0...v1.2.0) (2026-09-19)


### Features

* **users:** add account and user deletion modals and lifecycle delete action ([352db9f](https://github.com/Muljax/dashboard/commit/352db9f5c142c0b8e730f0c662bd423e7e74a91b))

## [1.1.0](https://github.com/Muljax/dashboard/compare/v1.0.0...v1.1.0) (2026-09-19)


### Features

* **rbac:** support ssh principal permissions prerequisite mapping ([712f011](https://github.com/Muljax/dashboard/commit/712f01137fb1764c854eb0874ecd463ca3319e9b))

## 1.0.0 (2026-09-19)


### Features

* add biome override to strip trailing commas from jsonc, run biome check, mount lifecycle route ([bfa3168](https://github.com/Muljax/dashboard/commit/bfa31683e006f0360aebe5b9bfc5621f39ceb8b5))
* add krl binary format ([42510f5](https://github.com/Muljax/dashboard/commit/42510f521f893044e3ee07f649208d165eb972a2))
* add route data, update sidebar, document navigation lib ([396d195](https://github.com/Muljax/dashboard/commit/396d195b762f853eb1451f7eed286c105ad7cf08))
* add usernameless passkey support, modify challenges table, update login / registration UI, introduce lucide ([122df7e](https://github.com/Muljax/dashboard/commit/122df7e894a44439ecd169bc282bd7e56c298f3c))
* admin users page ([fd3b8a1](https://github.com/Muljax/dashboard/commit/fd3b8a181b007448a403d3f76b722025ecdd328c))
* also mobile sidebar ([9ede660](https://github.com/Muljax/dashboard/commit/9ede6606945e4b7baae79b8c5e8c6102e79f3efd))
* **auth,admin:** add instance access policies, invite tokens, and break-glass sign-in keys ([9ba6620](https://github.com/Muljax/dashboard/commit/9ba6620717985f9f8b5b4e1ff26a33c2da7b5f80))
* basic lifecycle engine ([8a86f3a](https://github.com/Muljax/dashboard/commit/8a86f3afe9261d463110737fa52965da0c86dd80))
* better profile page ([80839ac](https://github.com/Muljax/dashboard/commit/80839ac30d8f7ca5c222683ee7c17674a7af08e9))
* **branding:** add dynamic instance name and custom logo support ([#198](https://github.com/Muljax/dashboard/issues/198)) ([aeb6a6d](https://github.com/Muljax/dashboard/commit/aeb6a6dcdd999e778ef3c632a0b570ff8dd0ecd8))
* **ci:** configure release-please monorepo manifest mode with 1.1.0 baseline ([7610c10](https://github.com/Muljax/dashboard/commit/7610c100528f0992c4a5c6443d8e458c2d4fac5d))
* dashboard respects rbac ([f77e1f4](https://github.com/Muljax/dashboard/commit/f77e1f406b7fa031b0ee5f05f337bc6d117297ee))
* **dashboard:** adopt @tanstack/react-form across all dashboard views ([#203](https://github.com/Muljax/dashboard/issues/203)) ([99198d4](https://github.com/Muljax/dashboard/commit/99198d49b5ad8ae7c571d018424110326c36b75e))
* **dashboard:** adopt @tanstack/react-query for state management and caching ([#205](https://github.com/Muljax/dashboard/issues/205)) ([79f42bc](https://github.com/Muljax/dashboard/commit/79f42bc21fd3af2b04b92e34a5e28275037017e3))
* **dashboard:** modularize user directory and support lifecycle scheduling ([#196](https://github.com/Muljax/dashboard/issues/196)) ([97167c5](https://github.com/Muljax/dashboard/commit/97167c551c4afe21b979c8e392ec7a2f9148d2e7))
* **dashboard:** read app version from dashboard package.json ([99fb64f](https://github.com/Muljax/dashboard/commit/99fb64ff799c1850dbd229ebf7c52cb0179f8af2))
* delete clients endpoint and ui ([8d4dc01](https://github.com/Muljax/dashboard/commit/8d4dc0156e5a27ac4514e22f9984467ef8d1e009))
* docs, ssh ca admin ui update ([6e35d7a](https://github.com/Muljax/dashboard/commit/6e35d7a2836d9cf06463f2095f10ad04d082d1ca))
* dynamic tab titles ([#200](https://github.com/Muljax/dashboard/issues/200)) ([0a09a8c](https://github.com/Muljax/dashboard/commit/0a09a8c7a7077443b14119fe39b7cd09cb9be643))
* fix oauth flow ([#60](https://github.com/Muljax/dashboard/issues/60)) ([624f1da](https://github.com/Muljax/dashboard/commit/624f1da974375b68d5f1566ea4d39bdea636ab08))
* hide admin routes from sidebar ([0c571f2](https://github.com/Muljax/dashboard/commit/0c571f24186daa30011e6c3f529233e94904653e))
* include build info in sidebar ([d1166a5](https://github.com/Muljax/dashboard/commit/d1166a5504ee669b4b7d846fa3c0ce30a800cbec))
* m2m oidc ([#184](https://github.com/Muljax/dashboard/issues/184)) ([34a20cb](https://github.com/Muljax/dashboard/commit/34a20cb1fae6c99fbb623a13a0d9cec790658f6f))
* major dashboard overhaul ([d2913c9](https://github.com/Muljax/dashboard/commit/d2913c9e7ae414208e2001bcb32d4d6054e4e0fb))
* migrate to terraform ([0ba73b3](https://github.com/Muljax/dashboard/commit/0ba73b34a2ea9fee86118d112a43cb9698136132))
* more compliance changes, this implementation passes basic compliance checks ([11823a9](https://github.com/Muljax/dashboard/commit/11823a98ea0d0a3a18109c95f066a2d61ab8c275))
* nescessary claims ([#66](https://github.com/Muljax/dashboard/issues/66)) ([e2be3c9](https://github.com/Muljax/dashboard/commit/e2be3c904b5b3c3f2b9a00195b6a4bd989504725))
* notification system and migration to new notification system ([#182](https://github.com/Muljax/dashboard/issues/182)) ([bc768f3](https://github.com/Muljax/dashboard/commit/bc768f3e22d0faad7713f0fae04e2acdce93820d))
* organize profile page ([efb107e](https://github.com/Muljax/dashboard/commit/efb107ec13f4e283c5a2d80d80d7b9682576a7cb))
* passkey registration UI ([04eec8c](https://github.com/Muljax/dashboard/commit/04eec8ca071653ea1d6e032eced0c344bfc28955))
* passkeys management ui ([02e9fae](https://github.com/Muljax/dashboard/commit/02e9fae8fb635bb3b5a50744de4d89d1782bbdff))
* password change page, resolve some ts nonsense ([6de7512](https://github.com/Muljax/dashboard/commit/6de7512c8cd2598bed05a0f8238bd3c46a3887f3))
* password reset ([#187](https://github.com/Muljax/dashboard/issues/187)) ([deda15a](https://github.com/Muljax/dashboard/commit/deda15a1638bbfb3e83c399da6f94cdb8c6d386f))
* rbac ([#221](https://github.com/Muljax/dashboard/issues/221)) ([3a6f1ae](https://github.com/Muljax/dashboard/commit/3a6f1ae51e972b459c906bc2635cc4f2c7c0e74c))
* **rbac:** enforce permission dependencies and role cache invalidation ([664b52d](https://github.com/Muljax/dashboard/commit/664b52d3df67392d101620ba48804817ae15d315))
* remember oauth auth choice ([#61](https://github.com/Muljax/dashboard/issues/61)) ([330bebf](https://github.com/Muljax/dashboard/commit/330bebfdd0d8ea966ad6566bf84d6a3cd686de05))
* **repo:** initialize autonomous dashboard repository with core docs, ci, and tooling ([49e4f4d](https://github.com/Muljax/dashboard/commit/49e4f4d8a6616f4863ac290a304b6cf777f5df19))
* split up api library, move passkey login function to login.tsx ([7ccafc0](https://github.com/Muljax/dashboard/commit/7ccafc0369237ad028e78a39770fe23f25a25c15))
* ssh ca ([81dc39b](https://github.com/Muljax/dashboard/commit/81dc39b0911ee49c9780c6a7862c4c28c5f9b520))
* support completely hidden routes, mark bootstrap page as hidden ([600c7c2](https://github.com/Muljax/dashboard/commit/600c7c27300826d704ddbb99b7f78057093414e8))
* support max age ([d4dea15](https://github.com/Muljax/dashboard/commit/d4dea153719357e8688f42d2d8e40f82f9b5dc99))
* support prompts ([bfc2c07](https://github.com/Muljax/dashboard/commit/bfc2c0729ab4df99bf8baab284e6be02c7766bb0))
* suppport acr values ([5fdfc18](https://github.com/Muljax/dashboard/commit/5fdfc18e46891adeae27c8e89bd60efd94028a0c))
* **types:** consume canonical DTO and schema types directly from @muljax/id-api ([ba38181](https://github.com/Muljax/dashboard/commit/ba38181a03c8f0e67451d60baf3df0c5ab43a31d))
* ui changes to passkeys page, fix bugs that caused a user to be unable to register a passkey due to usernameless passkeys implementation ([3f08ff1](https://github.com/Muljax/dashboard/commit/3f08ff12c1848194a0ebaf4864bdfb9f94b6133e))
* update passowrd page to include same password validation, change remove passkey styling in passkeys page ([069d87f](https://github.com/Muljax/dashboard/commit/069d87fc591ca63cd9f7d0107c263b6935888ed7))
* users avatar endpoint, various fixes ([#88](https://github.com/Muljax/dashboard/issues/88)) ([482569f](https://github.com/Muljax/dashboard/commit/482569f1abd96c73ad26268a3cce1866799952bd))
* verify response type in oauth flow, update ui for authorized apps and authorization page ([fab8165](https://github.com/Muljax/dashboard/commit/fab816564061403078210fd44360c6de5ed1f0d3))


### Bug Fixes

* add an inline password length error ([4d122f7](https://github.com/Muljax/dashboard/commit/4d122f78fd0389d7368e15a12e7ade8b974d9843))
* add the UI for selecting and adding custom scopes to clients ([#236](https://github.com/Muljax/dashboard/issues/236)) ([ba5c42e](https://github.com/Muljax/dashboard/commit/ba5c42eef530b10300c33001232fc8be3a0e7f98))
* **auth:** resolve double sign-in and cookie session persistence ([#213](https://github.com/Muljax/dashboard/issues/213)) ([79d1698](https://github.com/Muljax/dashboard/commit/79d1698c41e9edd4f88efabef40674d074ae9658))
* **auth:** tune rate limiter scope and issue session on registration ([004f0d9](https://github.com/Muljax/dashboard/commit/004f0d97c9613808a22359cfd49dcfe48f139ca4))
* bust admin user avatar cache ([061b831](https://github.com/Muljax/dashboard/commit/061b8318cca7c129bdb00a8cd6844471449c459b))
* **dashboard:** correct root error component typing ([42f4024](https://github.com/Muljax/dashboard/commit/42f4024bfb6e4032b80aa48f9327658fec5f1ab3))
* **deps:** point @muljax/id-api to github:Muljax/api ([f86817e](https://github.com/Muljax/dashboard/commit/f86817eb3354504d69b3a3fd093c85e47fb73db2))
* **deps:** update dependency @types/node to v26.4.1 ([23fc788](https://github.com/Muljax/dashboard/commit/23fc7882a844ff13c14304cd5ed9b83d4dc78d4e))
* **deps:** update dependency @types/node to v26.5.1 ([cffa740](https://github.com/Muljax/dashboard/commit/cffa7403fc545ed856390f16c68ab14b4957f3fb))
* **deps:** update dependency lucide-react to v1.41.0 ([8338ebc](https://github.com/Muljax/dashboard/commit/8338ebc8029d6642e9740822175afae0f4aacc9d))
* **deps:** update dependency lucide-react to v1.45.0 ([e6262ce](https://github.com/Muljax/dashboard/commit/e6262ce7c3e30914f67f4d7ab40ffe6c220b014e))
* **deps:** update dependency lucide-react to v1.46.0 ([c397133](https://github.com/Muljax/dashboard/commit/c397133485245c6c293d88e0b75a690465e3ba12))
* **deps:** update dependency lucide-react to v1.47.0 ([#229](https://github.com/Muljax/dashboard/issues/229)) ([241f064](https://github.com/Muljax/dashboard/commit/241f06485498cbc7c0c978bfe73bc6b1cdb3481e))
* **deps:** update dependency wrangler to v4.129.0 ([70aced2](https://github.com/Muljax/dashboard/commit/70aced27ad256e49a4e149bb04d35609177cbda6))
* **deps:** update react monorepo to v19.3.0 ([bff5c2b](https://github.com/Muljax/dashboard/commit/bff5c2b4711a856bdceba98861e9704a698b79e5))
* **deps:** update tanstack-router monorepo ([b5e1c77](https://github.com/Muljax/dashboard/commit/b5e1c77d822cd4f94575dcb8e799dc7a5db98a51))
* **deps:** update tanstack-router monorepo ([cdb4bcf](https://github.com/Muljax/dashboard/commit/cdb4bcf951b2a29822ecfbddd3cfe5b33e45ea9d))
* **deps:** update tanstack-router monorepo ([#219](https://github.com/Muljax/dashboard/issues/219)) ([4742322](https://github.com/Muljax/dashboard/commit/4742322f86f13b08523ccdb1792cd065319cd00f))
* **deps:** update tanstack-router monorepo ([#223](https://github.com/Muljax/dashboard/issues/223)) ([74d7e77](https://github.com/Muljax/dashboard/commit/74d7e77a02a1a949b2aeaacef0045bc27361daa4))
* extract error description ([76d70d0](https://github.com/Muljax/dashboard/commit/76d70d0541e7c4e6bbe8edc0aaa43fa646f58188))
* **infra:** resolve localhost truthiness bug, align wrangler configs, and wire migration variables ([a84f7f0](https://github.com/Muljax/dashboard/commit/a84f7f04c5effae13ce6c3b40f5ae2b1c01ea7d1))
* limit passwords to 128 characters to prevent CPU exhaustion DoS ([#178](https://github.com/Muljax/dashboard/issues/178)) ([9938953](https://github.com/Muljax/dashboard/commit/993895320077459a7927226cbd85e8b84d50e329))
* **oauth:** enable public cors, persist consent grants, and secure authorization redirects ([8d0026f](https://github.com/Muljax/dashboard/commit/8d0026f4aa953e8e879518439d3be1c7e112d56d))
* **oidc:** return consent_required on prompt=none when consent is missing ([461f145](https://github.com/Muljax/dashboard/commit/461f145c182019404ecb62649969066ac4168869))
* poll http notifications endpoint ([#191](https://github.com/Muljax/dashboard/issues/191)) ([d4216d7](https://github.com/Muljax/dashboard/commit/d4216d7fb1773e056842ff46b592fb99a8fb8e89))
* **tooling:** ensure dashboard is built to generate route tree prior to typecheck ([7c4c1f4](https://github.com/Muljax/dashboard/commit/7c4c1f49377c4d54ebc72fedbf7b5240c5c2d785))
* use react FormEvent type ([06a4693](https://github.com/Muljax/dashboard/commit/06a4693ecfe404b30f67c4c7d60c6e625d278422))

## [1.2.0](https://github.com/Muljax/id/compare/dashboard-v1.1.0...dashboard-v1.2.0) (2026-09-19)


### Features

* **dashboard:** read app version from dashboard package.json ([439b8c8](https://github.com/Muljax/id/commit/439b8c89f17fe7523acf914a09c37cd461268099))
