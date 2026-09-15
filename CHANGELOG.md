# Changelog

## [0.24.0](https://github.com/Muljax/id/compare/v0.23.0...v0.24.0) (2026-09-15)


### Features

* dynamic tab titles ([#200](https://github.com/Muljax/id/issues/200)) ([a185401](https://github.com/Muljax/id/commit/a185401b0a935575fc3307761463cc6d49c1e66d))

## [0.23.0](https://github.com/Muljax/id/compare/v0.22.0...v0.23.0) (2026-09-15)


### Features

* **branding:** add dynamic instance name and custom logo support ([#198](https://github.com/Muljax/id/issues/198)) ([afd0907](https://github.com/Muljax/id/commit/afd0907693e11cb4ff50a54c5c1e1657f9525a31))

## [0.22.0](https://github.com/Muljax/id/compare/v0.21.1...v0.22.0) (2026-09-15)


### Features

* **dashboard:** modularize user directory and support lifecycle scheduling ([#196](https://github.com/Muljax/id/issues/196)) ([9b79503](https://github.com/Muljax/id/commit/9b79503e4ba87462029d8b51af1fccc7eabd3492))

## [0.21.1](https://github.com/Muljax/id/compare/v0.21.0...v0.21.1) (2026-09-15)


### Bug Fixes

* **deps:** update dependency hono to v4.13.8 ([#189](https://github.com/Muljax/id/issues/189)) ([14a11b5](https://github.com/Muljax/id/commit/14a11b53d515898bbbba82ac924936e0d1d04df8))
* poll http notifications endpoint ([#191](https://github.com/Muljax/id/issues/191)) ([cf6d3ca](https://github.com/Muljax/id/commit/cf6d3ca91eb628b8ebe5f8c45c032d3bc12dc36d))

## [0.21.0](https://github.com/Muljax/id/compare/v0.20.0...v0.21.0) (2026-09-14)


### Features

* password reset ([#187](https://github.com/Muljax/id/issues/187)) ([50da541](https://github.com/Muljax/id/commit/50da5411d4e8e2f9d5ad1201996ca2dee2cd11e6))

## [0.20.0](https://github.com/Muljax/id/compare/v0.19.0...v0.20.0) (2026-09-14)


### Features

* m2m oidc ([#184](https://github.com/Muljax/id/issues/184)) ([e3541cc](https://github.com/Muljax/id/commit/e3541cc7d350898bcc1765a1f4c2488cd2a21661))

## [0.19.0](https://github.com/Muljax/id/compare/v0.18.3...v0.19.0) (2026-09-14)


### Features

* notification system and migration to new notification system ([#182](https://github.com/Muljax/id/issues/182)) ([a8d0fa8](https://github.com/Muljax/id/commit/a8d0fa828f5888c3466e770f9085797d924382b2))

## [0.18.3](https://github.com/Muljax/id/compare/v0.18.2...v0.18.3) (2026-09-14)


### Bug Fixes

* limit passwords to 128 characters to prevent CPU exhaustion DoS ([#178](https://github.com/Muljax/id/issues/178)) ([ea32aa1](https://github.com/Muljax/id/commit/ea32aa117a008e88b18423fb4b0e585dbcaee3cc))
* some cleanup ([#181](https://github.com/Muljax/id/issues/181)) ([026cc91](https://github.com/Muljax/id/commit/026cc91edd1781cde58bf133a21dce6d11f13194))
* validate emails during signup ([#180](https://github.com/Muljax/id/issues/180)) ([65589a0](https://github.com/Muljax/id/commit/65589a0e73889199ad0eb2db371e54e2475b8321))

## [0.18.2](https://github.com/Muljax/id/compare/v0.18.1...v0.18.2) (2026-09-14)


### Bug Fixes

* return 409 on username collision ([1121d64](https://github.com/Muljax/id/commit/1121d64d5d3b60537827e11add327f1757214731))

## [0.18.1](https://github.com/Muljax/id/compare/v0.18.0...v0.18.1) (2026-09-14)


### Bug Fixes

* **auth:** prevent passkey idor and enforce user disablement ([4e470cc](https://github.com/Muljax/id/commit/4e470cc0ade35a4c57308602a778dbf1a847f895))
* **deps:** update dependency lucide-react to v1.46.0 ([89dfd15](https://github.com/Muljax/id/commit/89dfd1561c32d568506eaa9a9d4de748af4c7ea6))

## [0.18.0](https://github.com/Muljax/id/compare/v0.17.4...v0.18.0) (2026-09-14)


### Features

* major dashboard overhaul ([29789a5](https://github.com/Muljax/id/commit/29789a5756ff3389cf741ac4660f6e9886e38fcc))

## [0.17.4](https://github.com/Muljax/id/compare/v0.17.3...v0.17.4) (2026-09-14)


### Bug Fixes

* **build:** bundle and upload wasm modules alongside api worker script ([25bc094](https://github.com/Muljax/id/commit/25bc09485cb45ca0b78f74b244c425f5afaaf221))

## [0.17.3](https://github.com/Muljax/id/compare/v0.17.2...v0.17.3) (2026-09-14)


### Bug Fixes

* auth bypass and unauthenticated endpoints ([#157](https://github.com/Muljax/id/issues/157)) ([15ac6dd](https://github.com/Muljax/id/commit/15ac6dd5f220c6051fb7fec28fdc5d6c4a879526))
* **auth:** tune rate limiter scope and issue session on registration ([5b72d97](https://github.com/Muljax/id/commit/5b72d9757f68f586ae4d1cde264ca536bda8c4e1))
* **infra:** resolve localhost truthiness bug, align wrangler configs, and wire migration variables ([2e4828e](https://github.com/Muljax/id/commit/2e4828e1dbc0e241dc1840be6fe7b6ee82415156))
* **oauth:** enable public cors, persist consent grants, and secure authorization redirects ([dacc6d7](https://github.com/Muljax/id/commit/dacc6d7fd91f213c67da33edd2db1aac49b64b41))
* **oauth:** enforce atomic token exchanges, token reuse detection, and public client pkce ([38b0e3d](https://github.com/Muljax/id/commit/38b0e3d926f0eb89b1d507a5b1d2474ee5f525b8))
* **security:** constant-time equality, user enumeration mitigation, and atomic passkeys ([5ce97e2](https://github.com/Muljax/id/commit/5ce97e2dd6e476a7dcd801c31b84be0533e2b04c))

## [0.17.2](https://github.com/Muljax/id/compare/v0.17.1...v0.17.2) (2026-09-14)


### Bug Fixes

* **deps:** update dependency @simplewebauthn/server to v14.0.2 ([5f1577e](https://github.com/Muljax/id/commit/5f1577e55f3341d277195d552e788d7bed6f4b22))
* **deps:** update dependency @types/node to v26.5.1 ([fca1ca7](https://github.com/Muljax/id/commit/fca1ca725cdd2e60b25b833cf74b829d1b843ab3))
* **deps:** update dependency lucide-react to v1.45.0 ([539c3f8](https://github.com/Muljax/id/commit/539c3f83a80c321aba0ef6efd3fe8e653744439d))
* **deps:** update react monorepo to v19.3.0 ([9606c72](https://github.com/Muljax/id/commit/9606c7212fc2e23fa7a3dd506698a0552d1b8f45))

## [0.17.1](https://github.com/Muljax/id/compare/v0.17.0...v0.17.1) (2026-09-13)


### Bug Fixes

* **deps:** update tanstack-router monorepo ([2947c26](https://github.com/Muljax/id/commit/2947c264eea4d11e9caef54d2667b3c5496ff209))

## [0.17.0](https://github.com/Muljax/id/compare/v0.16.0...v0.17.0) (2026-09-13)


### Features

* migrate to terraform ([5c38823](https://github.com/Muljax/id/commit/5c38823c74ab95d0d9fe8946549fd7206c0e6bc1))

## [0.16.0](https://github.com/Muljax/id/compare/v0.15.0...v0.16.0) (2026-09-12)


### Features

* also mobile sidebar ([93ed9d6](https://github.com/Muljax/id/commit/93ed9d680a07973396c165b7bd7a25fe4748d8dd))

## [0.15.0](https://github.com/Muljax/id/compare/v0.14.3...v0.15.0) (2026-09-07)


### Features

* better profile page ([39f1de1](https://github.com/Muljax/id/commit/39f1de1f36fc4d429eab5c63fae18e77eca47a33))

## [0.14.3](https://github.com/Muljax/id/compare/v0.14.2...v0.14.3) (2026-09-07)


### Bug Fixes

* **dashboard:** correct root error component typing ([13e20b7](https://github.com/Muljax/id/commit/13e20b71f8d023b6032dab067570879440a47f41))
* **deps:** update tanstack-router monorepo ([8ed8f50](https://github.com/Muljax/id/commit/8ed8f50bf9ae3b0452098848cf62cd00687c6b0c))
* you can pass forceDestroy to the R2 stack to empty the bucket ([71df8b6](https://github.com/Muljax/id/commit/71df8b685aed33ca120a401b5cab84c72a38b6df))

## [0.14.2](https://github.com/thehazell/id/compare/v0.14.1...v0.14.2) (2026-09-06)


### Bug Fixes

* **ci:** write OSV SARIF output to workspace ([5db9891](https://github.com/thehazell/id/commit/5db9891a6fa084c46c0b15676f8e05fc9dcd3edf))

## [0.14.1](https://github.com/thehazell/id/compare/v0.14.0...v0.14.1) (2026-09-06)


### Bug Fixes

* bust admin user avatar cache ([e3de255](https://github.com/thehazell/id/commit/e3de255daf19dd21a5e1afb4a5a87457cd2e8e9a))

## [0.14.0](https://github.com/thehazell/id/compare/v0.13.0...v0.14.0) (2026-09-06)


### Features

* users avatar endpoint, various fixes ([#88](https://github.com/thehazell/id/issues/88)) ([876bdff](https://github.com/thehazell/id/commit/876bdff54bb917a82dd2ee0326bc319036a1926f))

## [0.13.0](https://github.com/thehazell/id/compare/v0.12.0...v0.13.0) (2026-09-06)


### Features

* admin users page ([1737a4a](https://github.com/thehazell/id/commit/1737a4a8592b30f92e99118168d6b212104d5f7d))

## [0.12.0](https://github.com/thehazell/id/compare/v0.11.0...v0.12.0) (2026-09-06)


### Features

* organize profile page ([f2961e4](https://github.com/thehazell/id/commit/f2961e482941abbefa5f261fcb32dbcc1a7cb604))
* profile page organization, generic field component, routing fixes  in api ([#75](https://github.com/thehazell/id/issues/75)) ([0e73b7e](https://github.com/thehazell/id/commit/0e73b7e40ea6983457978ccbedddc163604dcc04))

## [0.11.0](https://github.com/thehazell/id/compare/v0.10.0...v0.11.0) (2026-09-06)


### Features

* organize auth routes ([0510e49](https://github.com/thehazell/id/commit/0510e495e7638aec64f5986e3ba8e31190f1b6df))
* organize oauth routes ([5b0f6cf](https://github.com/thehazell/id/commit/5b0f6cf70a8d7941029969470fa7b1cb659454db))
* reorganize admin routes ([8cc1b8b](https://github.com/thehazell/id/commit/8cc1b8b9b2073a2a531735ee7e12614ccfacdedc))
* reorganize passkeys routes ([6aecabe](https://github.com/thehazell/id/commit/6aecabee8e26350bc7675233d24dbcba5308a9bc))
* reorganize well-known routes ([d4a4c36](https://github.com/thehazell/id/commit/d4a4c36680ba63af68be1208132b497c7fdffa04))
* start reorgnizing routes ([5b55cb1](https://github.com/thehazell/id/commit/5b55cb1dd9208a5e8c69437bd2421701283427db))

## [0.10.0](https://github.com/thehazell/id/compare/v0.9.0...v0.10.0) (2026-09-06)


### Features

* nescessary claims ([#66](https://github.com/thehazell/id/issues/66)) ([8acdcfb](https://github.com/thehazell/id/commit/8acdcfb64a5cff41a5bd4b615e7c43af07de3243))

## [0.9.0](https://github.com/thehazell/id/compare/v0.8.0...v0.9.0) (2026-09-05)


### Features

* auth time in id token ([2a09950](https://github.com/thehazell/id/commit/2a09950391b033566812f49654b16a808373f915))
* cache control, discovery document update, more ([92aabbd](https://github.com/thehazell/id/commit/92aabbdff33e839d49cb874582dae3343e84a8d6))
* client secret basic advertised support ([59c0a9a](https://github.com/thehazell/id/commit/59c0a9a0df1f5f0068e8f53640273470e4c0ae0f))
* full profile scope support migration ([16a1868](https://github.com/thehazell/id/commit/16a18680eb081fc1144a0f137b3ca9b4821ddfe6))
* include info in id token based on scope ([#63](https://github.com/thehazell/id/issues/63)) ([d9b3219](https://github.com/thehazell/id/commit/d9b3219edc24c387e27887d5016fddc4ca8b22cf))
* lots of compliance change, new lib ([195bc14](https://github.com/thehazell/id/commit/195bc1481b77bd7a077ecd0524b411a44a4db41e))
* more compliance changes, this implementation passes basic compliance checks ([1a73b62](https://github.com/thehazell/id/commit/1a73b62e233946d3e83624699f38d68ac4545e15))
* support client secret basic ([ca1d358](https://github.com/thehazell/id/commit/ca1d3584c85ea4cb4d3428e9586ca84b57e45212))
* support max age ([1ea09d0](https://github.com/thehazell/id/commit/1ea09d0878609962b88f4eacf79420aa7f00c8a0))
* support post  auth, fix redirect bug ([90ec954](https://github.com/thehazell/id/commit/90ec954a0671d3a0c3a0bc89ae75ea51ab812631))
* support prompts ([106b3f7](https://github.com/thehazell/id/commit/106b3f721dfe265b36fa161bf310f24eb2336cc1))
* suppport acr values ([2839110](https://github.com/thehazell/id/commit/2839110bddea09ee2e8180c81f3444e63ed5257f))


### Bug Fixes

* actually store auth time ([0f6b7d3](https://github.com/thehazell/id/commit/0f6b7d311506f22d60f2c46280845e25e8fa3545))
* add acr claim ([644015c](https://github.com/thehazell/id/commit/644015ce36a4791a867043b8ac345c8aa22a476f))
* advertise none supported request signing alg ([22d1dd2](https://github.com/thehazell/id/commit/22d1dd2ed6bff88943a81cec92e6260ae5b64421))
* fix typo in openid config ([888be72](https://github.com/thehazell/id/commit/888be7211f077cb2fc06fdcb8bc717b6d770c668))
* **oauth:** revoke access tokens when authorization codes are reused ([ab310ba](https://github.com/thehazell/id/commit/ab310ba18e5149ad81f7137a87828703ad867f66))
* provide authorization code ID ([f2ee8c3](https://github.com/thehazell/id/commit/f2ee8c37cbf8e837cc17c5be9d313c1f8bb28f5d))
* provide storedToken.id to createAccessToken ([c1866a4](https://github.com/thehazell/id/commit/c1866a414f6525ce633815b854e37f013e9c8df4))
* return proper error if response code is missing ([32b02d5](https://github.com/thehazell/id/commit/32b02d565fb85edab30886f8f44ba3c325d64ff7))

## [0.8.0](https://github.com/thehazell/id/compare/v0.7.0...v0.8.0) (2026-09-05)


### Features

* remember oauth auth choice ([#61](https://github.com/thehazell/id/issues/61)) ([5433360](https://github.com/thehazell/id/commit/543336090fb71deeba4e1e2e801155010d0a3d3b))

## [0.7.0](https://github.com/thehazell/id/compare/v0.6.1...v0.7.0) (2026-09-05)


### Features

* fix oauth flow ([#60](https://github.com/thehazell/id/issues/60)) ([d0cc658](https://github.com/thehazell/id/commit/d0cc658548fb8bed351eb54cb6c25e4c32d08dfa))
* list users endpoint ([73d0990](https://github.com/thehazell/id/commit/73d099068bbccc510729bae8bd7137ef85d49d7f))
* split up api library, move passkey login function to login.tsx ([3463acd](https://github.com/thehazell/id/commit/3463acd4a46314ff4aaa72e8fbc5e2bd37d2563a))

## [0.6.1](https://github.com/thehazell/id/compare/v0.6.0...v0.6.1) (2026-09-05)


### Bug Fixes

* **deps:** update dependency @simplewebauthn/server to v14.0.1 ([735b0cc](https://github.com/thehazell/id/commit/735b0cca010bc733a602eeec9f90ca4709f93fa1))
* **deps:** update dependency @types/node to v26.4.1 ([f13645b](https://github.com/thehazell/id/commit/f13645bf09cc18229d10d64fc619990e0192eddd))
* **deps:** update dependency drizzle-orm to v1.0.0-rc.5-ab785fc ([e5b3825](https://github.com/thehazell/id/commit/e5b38256dcf95b4ea5b299b71bdaf67e937bf2a9))
* **deps:** update dependency hono to v4.13.7 ([8be90b7](https://github.com/thehazell/id/commit/8be90b738a522018e6346b4cfdb07cffdbc78a78))
* **deps:** update dependency lucide-react to v1.41.0 ([46eee25](https://github.com/thehazell/id/commit/46eee25239a5296f9d96eb6280eca1155f4d401a))
* **deps:** update dependency wrangler to v4.129.0 ([98bef0d](https://github.com/thehazell/id/commit/98bef0da3b323df240fade50a20f2eee857975bd))

## [0.6.0](https://github.com/thehazell/id/compare/v0.5.4...v0.6.0) (2026-09-05)


### Features

* delete clients endpoint and ui ([ef3bf8b](https://github.com/thehazell/id/commit/ef3bf8b7c742094748f4ecd7626522f7ccd3bee5))

## [0.5.4](https://github.com/thehazell/id/compare/v0.5.3...v0.5.4) (2026-09-05)


### Bug Fixes

* **deps:** update dependency @simplewebauthn/browser to v14 ([ce276b6](https://github.com/thehazell/id/commit/ce276b62b3b956e17b7cb37382a9a0632a9b80aa))

## [0.5.3](https://github.com/thehazell/id/compare/v0.5.2...v0.5.3) (2026-09-05)


### Bug Fixes

* **deps:** update dependency @simplewebauthn/server to v14 ([#30](https://github.com/thehazell/id/issues/30)) ([b95d8ac](https://github.com/thehazell/id/commit/b95d8ac8a8a82c25806d0e80c25ce7ba865b0f09))

## [0.5.1](https://github.com/thehazell/id/compare/v0.5.0...v0.5.1) (2026-09-05)


### Bug Fixes

* **db:** update D1 initialization for Drizzle 1.0 RC ([018f5e3](https://github.com/thehazell/id/commit/018f5e317d1bc4a3cb529665fad7cbefb0b6074d))

## [0.5.0](https://github.com/thehazell/id/compare/v0.4.4...v0.5.0) (2026-09-04)


### Features

* migrate setup to alchemy, remove argon as a feature flag and only hashing algorithim ([732a6fb](https://github.com/thehazell/id/commit/732a6fbda35fc40f0cfe221b3a52bd01c861fcb3))
* migrate to alchemy ([#16](https://github.com/thehazell/id/issues/16)) ([b1b7454](https://github.com/thehazell/id/commit/b1b74542b5900c9a5c8b41d57e3748c4d5b8aee5))
