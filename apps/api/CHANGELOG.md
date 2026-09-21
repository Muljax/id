# Changelog

## [1.3.0](https://github.com/Muljax/id/compare/id-api-v1.2.0...id-api-v1.3.0) (2026-09-21)


### Features

* actual enable/disable workflow support ([9bff065](https://github.com/Muljax/id/commit/9bff065a88a01e2acea646e20f073b5d9d03260c))
* add base for rate limiting ([94cc6da](https://github.com/Muljax/id/commit/94cc6da53b4adc11b58e93df19da62ee8f4abfb7))
* add biome override to strip trailing commas from jsonc, run biome check, mount lifecycle route ([6ae6bb1](https://github.com/Muljax/id/commit/6ae6bb1484179320c84ae829802b1364d3ec398f))
* add krl binary format ([f615e9f](https://github.com/Muljax/id/commit/f615e9f93e54598a8e0e57132438bc2739e42a9c))
* add rateLimiter middleware and apply it to all auth endpoints ([2eee1ce](https://github.com/Muljax/id/commit/2eee1cee00bea465e5f9377f3f3230d22542d9c5))
* add test lifecycle version ([0632094](https://github.com/Muljax/id/commit/06320943ed5f0d66e54f7a6f3748bdcc1e233f44))
* add usernameless passkey support, modify challenges table, update login / registration UI, introduce lucide ([d8e72bd](https://github.com/Muljax/id/commit/d8e72bded6cfb68d764ee447db58c64e7a2de75f))
* admin users page ([1737a4a](https://github.com/Muljax/id/commit/1737a4a8592b30f92e99118168d6b212104d5f7d))
* **api:** return package version on health endpoint ([b7f7dde](https://github.com/Muljax/id/commit/b7f7dde8380bb7be339c27779083193d86fca30d))
* auth time in id token ([2a09950](https://github.com/Muljax/id/commit/2a09950391b033566812f49654b16a808373f915))
* **auth,admin:** add instance access policies, invite tokens, and break-glass sign-in keys ([e4efc87](https://github.com/Muljax/id/commit/e4efc87373c7af3331fc91b83dcd3d1349dc25cb))
* basic lifecycle engine ([06d3137](https://github.com/Muljax/id/commit/06d31372004031a3e98719468afdfaf79d464cc7))
* **branding:** add dynamic instance name and custom logo support ([#198](https://github.com/Muljax/id/issues/198)) ([afd0907](https://github.com/Muljax/id/commit/afd0907693e11cb4ff50a54c5c1e1657f9525a31))
* cache control, discovery document update, more ([92aabbd](https://github.com/Muljax/id/commit/92aabbdff33e839d49cb874582dae3343e84a8d6))
* **ci:** configure release-please monorepo manifest mode with 1.1.0 baseline ([3898ca9](https://github.com/Muljax/id/commit/3898ca952084d4fbcf60c9d4580396b9936bcdba))
* client secret basic advertised support ([59c0a9a](https://github.com/Muljax/id/commit/59c0a9a0df1f5f0068e8f53640273470e4c0ae0f))
* dashboard respects rbac ([d39ff97](https://github.com/Muljax/id/commit/d39ff976c692e99fe2e5d183c42566dde6a73dd5))
* dashboard stying update, several fixes ([#15](https://github.com/Muljax/id/issues/15)) ([9483ac8](https://github.com/Muljax/id/commit/9483ac8c8a9c0c9d2e8a120cb376d7cddc2fb58a))
* **dashboard:** modularize user directory and support lifecycle scheduling ([#196](https://github.com/Muljax/id/issues/196)) ([9b79503](https://github.com/Muljax/id/commit/9b79503e4ba87462029d8b51af1fccc7eabd3492))
* delete clients endpoint and ui ([ef3bf8b](https://github.com/Muljax/id/commit/ef3bf8b7c742094748f4ecd7626522f7ccd3bee5))
* fix oauth flow ([#60](https://github.com/Muljax/id/issues/60)) ([d0cc658](https://github.com/Muljax/id/commit/d0cc658548fb8bed351eb54cb6c25e4c32d08dfa))
* full profile scope support migration ([16a1868](https://github.com/Muljax/id/commit/16a18680eb081fc1144a0f137b3ca9b4821ddfe6))
* implement engine to control schedulding semantics including timing conflicts ([46b9b7c](https://github.com/Muljax/id/commit/46b9b7cd667efaf28811e86ec1126ec1c2448155))
* include info in id token based on scope ([#63](https://github.com/Muljax/id/issues/63)) ([d9b3219](https://github.com/Muljax/id/commit/d9b3219edc24c387e27887d5016fddc4ca8b22cf))
* lifecycle action claiming ([afb953a](https://github.com/Muljax/id/commit/afb953a78dec1051ac5aa94eadc6e341c3842832))
* lifecycle table ([9788a8c](https://github.com/Muljax/id/commit/9788a8cac3c72c306b4faad83932edc3d7fde61e))
* list users endpoint ([73d0990](https://github.com/Muljax/id/commit/73d099068bbccc510729bae8bd7137ef85d49d7f))
* lots of compliance change, new lib ([195bc14](https://github.com/Muljax/id/commit/195bc1481b77bd7a077ecd0524b411a44a4db41e))
* m2m oidc ([#184](https://github.com/Muljax/id/issues/184)) ([e3541cc](https://github.com/Muljax/id/commit/e3541cc7d350898bcc1765a1f4c2488cd2a21661))
* major dashboard overhaul ([29789a5](https://github.com/Muljax/id/commit/29789a5756ff3389cf741ac4660f6e9886e38fcc))
* migrate setup to alchemy, remove argon as a feature flag and only hashing algorithim ([732a6fb](https://github.com/Muljax/id/commit/732a6fbda35fc40f0cfe221b3a52bd01c861fcb3))
* migrate to alchemy ([#16](https://github.com/Muljax/id/issues/16)) ([b1b7454](https://github.com/Muljax/id/commit/b1b74542b5900c9a5c8b41d57e3748c4d5b8aee5))
* migrate to terraform ([5c38823](https://github.com/Muljax/id/commit/5c38823c74ab95d0d9fe8946549fd7206c0e6bc1))
* more compliance changes, this implementation passes basic compliance checks ([1a73b62](https://github.com/Muljax/id/commit/1a73b62e233946d3e83624699f38d68ac4545e15))
* nescessary claims ([#66](https://github.com/Muljax/id/issues/66)) ([8acdcfb](https://github.com/Muljax/id/commit/8acdcfb64a5cff41a5bd4b615e7c43af07de3243))
* notification system and migration to new notification system ([#182](https://github.com/Muljax/id/issues/182)) ([a8d0fa8](https://github.com/Muljax/id/commit/a8d0fa828f5888c3466e770f9085797d924382b2))
* organize auth routes ([0510e49](https://github.com/Muljax/id/commit/0510e495e7638aec64f5986e3ba8e31190f1b6df))
* organize oauth routes ([5b0f6cf](https://github.com/Muljax/id/commit/5b0f6cf70a8d7941029969470fa7b1cb659454db))
* password reset ([#187](https://github.com/Muljax/id/issues/187)) ([50da541](https://github.com/Muljax/id/commit/50da5411d4e8e2f9d5ad1201996ca2dee2cd11e6))
* profile page organization, generic field component, routing fixes  in api ([#75](https://github.com/Muljax/id/issues/75)) ([0e73b7e](https://github.com/Muljax/id/commit/0e73b7e40ea6983457978ccbedddc163604dcc04))
* rbac ([#221](https://github.com/Muljax/id/issues/221)) ([58d517a](https://github.com/Muljax/id/commit/58d517a2793e6049967805809998dc5bd77870ec))
* **rbac:** enforce permission dependencies and role cache invalidation ([8a1b349](https://github.com/Muljax/id/commit/8a1b3490fa78ddfd9cc057592537deb0b9e2af40))
* remember oauth auth choice ([#61](https://github.com/Muljax/id/issues/61)) ([5433360](https://github.com/Muljax/id/commit/543336090fb71deeba4e1e2e801155010d0a3d3b))
* reorganize admin routes ([8cc1b8b](https://github.com/Muljax/id/commit/8cc1b8b9b2073a2a531735ee7e12614ccfacdedc))
* reorganize passkeys routes ([6aecabe](https://github.com/Muljax/id/commit/6aecabee8e26350bc7675233d24dbcba5308a9bc))
* reorganize well-known routes ([d4a4c36](https://github.com/Muljax/id/commit/d4a4c36680ba63af68be1208132b497c7fdffa04))
* **repo:** convert component apps to autonomous git submodules ([39debca](https://github.com/Muljax/id/commit/39debcadd070c5d5f85f02373a3b070f910a3f03))
* seeding docs, seed cli client, allow loopback redirect URIs on any port ([a77f92d](https://github.com/Muljax/id/commit/a77f92de3b797a857cd77f9dbf990888a18f4a56))
* split up api library, move passkey login function to login.tsx ([3463acd](https://github.com/Muljax/id/commit/3463acd4a46314ff4aaa72e8fbc5e2bd37d2563a))
* ssh ca ([e5fbb4a](https://github.com/Muljax/id/commit/e5fbb4a98ad12e2dd18b7d9b1d5be787f42cabae))
* **ssh:** add cleanup job that removes expired certificates whether or not they are revoked ([c97a509](https://github.com/Muljax/id/commit/c97a509edd9b44ef8a15ca6a34dfe763a2d2cc76))
* start reorgnizing routes ([5b55cb1](https://github.com/Muljax/id/commit/5b55cb1dd9208a5e8c69437bd2421701283427db))
* support client secret basic ([ca1d358](https://github.com/Muljax/id/commit/ca1d3584c85ea4cb4d3428e9586ca84b57e45212))
* support max age ([1ea09d0](https://github.com/Muljax/id/commit/1ea09d0878609962b88f4eacf79420aa7f00c8a0))
* support post  auth, fix redirect bug ([90ec954](https://github.com/Muljax/id/commit/90ec954a0671d3a0c3a0bc89ae75ea51ab812631))
* support prompts ([106b3f7](https://github.com/Muljax/id/commit/106b3f721dfe265b36fa161bf310f24eb2336cc1))
* suppport acr values ([2839110](https://github.com/Muljax/id/commit/2839110bddea09ee2e8180c81f3444e63ed5257f))
* ui changes to passkeys page, fix bugs that caused a user to be unable to register a passkey due to usernameless passkeys implementation ([ff4436a](https://github.com/Muljax/id/commit/ff4436a326c3c2e2b983a19f56099be5d59ddba6))
* user lifecycle create endpoint ([cf27a49](https://github.com/Muljax/id/commit/cf27a4941b9f3dc6492f10321975576b246b10af))
* usernameless passkey login, ui updates for login/registration, fix for white screen flashbangs between reloads ([#13](https://github.com/Muljax/id/issues/13)) ([9872472](https://github.com/Muljax/id/commit/987247250193452971e34db41bd74a6003fc6368))
* users avatar endpoint, various fixes ([#88](https://github.com/Muljax/id/issues/88)) ([876bdff](https://github.com/Muljax/id/commit/876bdff54bb917a82dd2ee0326bc319036a1926f))
* verify response type in oauth flow, update ui for authorized apps and authorization page ([e8ea694](https://github.com/Muljax/id/commit/e8ea694e69afe2e34bd16d627054786d55dff9e0))


### Bug Fixes

* actually store auth time ([0f6b7d3](https://github.com/Muljax/id/commit/0f6b7d311506f22d60f2c46280845e25e8fa3545))
* add acr claim ([644015c](https://github.com/Muljax/id/commit/644015ce36a4791a867043b8ac345c8aa22a476f))
* add the UI for selecting and adding custom scopes to clients ([#236](https://github.com/Muljax/id/issues/236)) ([50812af](https://github.com/Muljax/id/commit/50812af626c538206eb99555a92b66297c299c51))
* advertise none supported request signing alg ([22d1dd2](https://github.com/Muljax/id/commit/22d1dd2ed6bff88943a81cec92e6260ae5b64421))
* **api:** support raw text negotiation and pubkey alias for ssh ca public key ([62859f1](https://github.com/Muljax/id/commit/62859f179632397847d69841c3940e7ff674192a))
* auth bypass and unauthenticated endpoints ([#157](https://github.com/Muljax/id/issues/157)) ([15ac6dd](https://github.com/Muljax/id/commit/15ac6dd5f220c6051fb7fec28fdc5d6c4a879526))
* **auth:** make password reset token consumption atomic to prevent replay and race conditions ([86ab445](https://github.com/Muljax/id/commit/86ab445cfcc6b4b3cb06b0a7b59936c5ec8dc9fd))
* **auth:** prevent passkey idor and enforce user disablement ([4e470cc](https://github.com/Muljax/id/commit/4e470cc0ade35a4c57308602a778dbf1a847f895))
* **auth:** prevent race conditions in single-use invite token registration ([42d69b2](https://github.com/Muljax/id/commit/42d69b28e8d0b2aea45fed498adde816a50ba28f))
* **auth:** resolve double sign-in and cookie session persistence ([#213](https://github.com/Muljax/id/issues/213)) ([cfcfc8f](https://github.com/Muljax/id/commit/cfcfc8ff6309bd9cccf8c1ced26a19cd772f7169))
* **auth:** restrict OAuth tokens to granted scopes and guard account mutations ([#233](https://github.com/Muljax/id/issues/233)) ([feec962](https://github.com/Muljax/id/commit/feec962de4dfa3a8ef590718d5dadd081b57d01a))
* **auth:** tighten cookie sameSite to Lax and add origin validation on oauth consent ([daf2d74](https://github.com/Muljax/id/commit/daf2d74fa3e43fb7277bb1007b7932cf86317ab1))
* **auth:** tune rate limiter scope and issue session on registration ([5b72d97](https://github.com/Muljax/id/commit/5b72d9757f68f586ae4d1cde264ca536bda8c4e1))
* **build:** bundle and upload wasm modules alongside api worker script ([25bc094](https://github.com/Muljax/id/commit/25bc09485cb45ca0b78f74b244c425f5afaaf221))
* **crypto:** resolve illegal invocation in timingSafeEqual ([#216](https://github.com/Muljax/id/issues/216)) ([36de80a](https://github.com/Muljax/id/commit/36de80a719ca9f67f369259806f4ab35043235d5))
* **db:** update D1 initialization for Drizzle 1.0 RC ([018f5e3](https://github.com/Muljax/id/commit/018f5e317d1bc4a3cb529665fad7cbefb0b6074d))
* default case is now error, move execution into engine.ts ([2a68909](https://github.com/Muljax/id/commit/2a6890984f8c5e69ee129343f5ada3d0d43d0ab4))
* **deps:** update dependency @types/node to v26.4.1 ([f13645b](https://github.com/Muljax/id/commit/f13645bf09cc18229d10d64fc619990e0192eddd))
* **deps:** update dependency @types/node to v26.5.1 ([fca1ca7](https://github.com/Muljax/id/commit/fca1ca725cdd2e60b25b833cf74b829d1b843ab3))
* **deps:** update dependency drizzle-orm to v1.0.0-rc.5-ab785fc ([e5b3825](https://github.com/Muljax/id/commit/e5b38256dcf95b4ea5b299b71bdaf67e937bf2a9))
* **deps:** update dependency hono to v4.13.7 ([8be90b7](https://github.com/Muljax/id/commit/8be90b738a522018e6346b4cfdb07cffdbc78a78))
* **deps:** update dependency hono to v4.13.8 ([#189](https://github.com/Muljax/id/issues/189)) ([14a11b5](https://github.com/Muljax/id/commit/14a11b53d515898bbbba82ac924936e0d1d04df8))
* fix typo in openid config ([888be72](https://github.com/Muljax/id/commit/888be7211f077cb2fc06fdcb8bc717b6d770c668))
* guard against a workflow not corresponding to any lifecycle_actions row ([0302e2b](https://github.com/Muljax/id/commit/0302e2b0cadcd26d5691d053b37fccbaba47c41f))
* **infra:** resolve localhost truthiness bug, align wrangler configs, and wire migration variables ([2e4828e](https://github.com/Muljax/id/commit/2e4828e1dbc0e241dc1840be6fe7b6ee82415156))
* **invites:** enforce caller permission ceiling on invite token creation ([b1a6999](https://github.com/Muljax/id/commit/b1a6999ed46476ede79ef985c1d7beb828e58a0c))
* **lifecycle:** revoke active ssh certificates upon user deactivation ([48061c3](https://github.com/Muljax/id/commit/48061c323e6cd8d8f1db8e49cc192f537f22028b))
* limit passwords to 128 characters to prevent CPU exhaustion DoS ([#178](https://github.com/Muljax/id/issues/178)) ([ea32aa1](https://github.com/Muljax/id/commit/ea32aa117a008e88b18423fb4b0e585dbcaee3cc))
* **oauth:** enable public cors, persist consent grants, and secure authorization redirects ([dacc6d7](https://github.com/Muljax/id/commit/dacc6d7fd91f213c67da33edd2db1aac49b64b41))
* **oauth:** enforce atomic token exchanges, token reuse detection, and public client pkce ([38b0e3d](https://github.com/Muljax/id/commit/38b0e3d926f0eb89b1d507a5b1d2474ee5f525b8))
* **oauth:** redirect authorization errors to valid redirect_uri per rfc6749 ([908fd75](https://github.com/Muljax/id/commit/908fd75ccba2844409726b88c4cc2b37e4103c08))
* **oauth:** respect sign in policy ([efc9c67](https://github.com/Muljax/id/commit/efc9c67d6e33c573258d77651f6c6fc5947c8279))
* **oauth:** revoke access tokens when authorization codes are reused ([ab310ba](https://github.com/Muljax/id/commit/ab310ba18e5149ad81f7137a87828703ad867f66))
* **oauth:** revoke refresh tokens on code reuse and gate id_token on openid scope ([04d3a72](https://github.com/Muljax/id/commit/04d3a72254c657493e954bb53ee3f04e0d4df5e3))
* **oidc:** add revocation and introspection endpoints to openid discovery ([7947a41](https://github.com/Muljax/id/commit/7947a41ddfe61d84c88730bc14ba2244a277056b))
* **oidc:** enforce openid scope requirement on userinfo endpoint ([5bd5da9](https://github.com/Muljax/id/commit/5bd5da9e582255ab0d8531085d131556e86f1548))
* **oidc:** return consent_required on prompt=none when consent is missing ([85ca299](https://github.com/Muljax/id/commit/85ca29973fad7b0a2f6855b7f37ac779f4dd9a6b))
* provide authorization code ID ([f2ee8c3](https://github.com/Muljax/id/commit/f2ee8c37cbf8e837cc17c5be9d313c1f8bb28f5d))
* provide storedToken.id to createAccessToken ([c1866a4](https://github.com/Muljax/id/commit/c1866a414f6525ce633815b854e37f013e9c8df4))
* **rbac:** enforce permission ceiling on role assignment and role modification ([321ef98](https://github.com/Muljax/id/commit/321ef98dfd00b1de324bb5edb7c9f838e54ae435))
* **rbac:** reference SYSTEM_ROLE_IDS.ADMIN constant consistently ([0042f2a](https://github.com/Muljax/id/commit/0042f2a2be04cacf36aa1b98d266cb931debc750))
* **rbac:** support multi-level hierarchical wildcards in permission matcher ([6ac2a06](https://github.com/Muljax/id/commit/6ac2a06fd1e1dde360ee04a70fedeae0e2c83edd))
* reconcile database row if workflow creation fails ([741dee3](https://github.com/Muljax/id/commit/741dee3be3635ba0d1a80e8c02521a3a8e13668a))
* return 409 on username collision ([1121d64](https://github.com/Muljax/id/commit/1121d64d5d3b60537827e11add327f1757214731))
* return proper error if response code is missing ([32b02d5](https://github.com/Muljax/id/commit/32b02d565fb85edab30886f8f44ba3c325d64ff7))
* **security:** constant-time equality, user enumeration mitigation, and atomic passkeys ([5ce97e2](https://github.com/Muljax/id/commit/5ce97e2dd6e476a7dcd801c31b84be0533e2b04c))
* seperate execution failure from completion persistence ([7115334](https://github.com/Muljax/id/commit/7115334c54684bc445d87a3e60886850803a325c))
* some cleanup ([#181](https://github.com/Muljax/id/issues/181)) ([026cc91](https://github.com/Muljax/id/commit/026cc91edd1781cde58bf133a21dce6d11f13194))
* **ssh:** sort critical options lexicographically and wrap inner option strings ([d907376](https://github.com/Muljax/id/commit/d907376297ced442e1e0283ea4a1017e071f450d))
* validate body properly ([5c36a62](https://github.com/Muljax/id/commit/5c36a62db1be2411a726e23a5d1b4ac4feb3f627))
* validate emails during signup ([#180](https://github.com/Muljax/id/issues/180)) ([65589a0](https://github.com/Muljax/id/commit/65589a0e73889199ad0eb2db371e54e2475b8321))


### Performance Improvements

* background expired session deletion ([#208](https://github.com/Muljax/id/issues/208)) ([93b4e2c](https://github.com/Muljax/id/commit/93b4e2c81131198dd727d52d90a51a70d1895649))
* set argon2id memory alloc to 19mb ([#210](https://github.com/Muljax/id/issues/210)) ([dd5794c](https://github.com/Muljax/id/commit/dd5794c6ebede41345c824eb254e495083754c2a))
* use javascript native toHex ([#211](https://github.com/Muljax/id/issues/211)) ([a773099](https://github.com/Muljax/id/commit/a7730991634c395bbbbbe119ad18719682ddf72d))
* use native base64 and timingSafeEqual methods ([#212](https://github.com/Muljax/id/issues/212)) ([2837f8a](https://github.com/Muljax/id/commit/2837f8a85ee75625ff4681cc7d22c0a9571c9824))

## [1.7.0](https://github.com/Muljax/api/compare/v1.6.0...v1.7.0) (2026-09-20)


### Features

* **auth:** implement step-up re-authentication and session elevation ([0937342](https://github.com/Muljax/api/commit/0937342dc897a7617f9957c73edf91167ad300ca))
* **security:** require step-up elevation for destructive admin actions ([59d2d98](https://github.com/Muljax/api/commit/59d2d98c0bbcf8473789b510e7c81fce0e97b22d))

## [1.6.0](https://github.com/Muljax/api/compare/v1.5.0...v1.6.0) (2026-09-20)


### Features

* **passkeys:** persist standard fido2 aaguid, backup state, and device type ([c8d53d9](https://github.com/Muljax/api/commit/c8d53d9fd85395c1cd9b49a2d55979547ce07025))

## [1.5.0](https://github.com/Muljax/api/compare/v1.4.0...v1.5.0) (2026-09-20)


### Features

* **security:** add security headers and sensitive cache control middleware ([8dd6a54](https://github.com/Muljax/api/commit/8dd6a544f66d2761a01edbb0e0a8e80d3a4fadff))
* **security:** implement comprehensive Cloudflare native rate limiting across sensitive endpoints ([30228a3](https://github.com/Muljax/api/commit/30228a36a32c2f63be3474fcfdeae6255af5a804))
* **security:** require strict interactive session for sensitive operations ([4e677f1](https://github.com/Muljax/api/commit/4e677f1155c5455beb7fc1bbce0f7903515a7c8a))

## [1.4.0](https://github.com/Muljax/api/compare/v1.3.0...v1.4.0) (2026-09-20)


### Features

* **oauth:** implement rfc 8628 device authorization grant and cors routing ([716e322](https://github.com/Muljax/api/commit/716e32213bac7cdccbf0da0ac7f852dcda9b613c))
* **security:** add universal csrf middleware and remove redundant endpoint origin checks ([3ba063c](https://github.com/Muljax/api/commit/3ba063cd6fc763a5e5fa43309c40e0ccc1340cc7))

## [1.3.0](https://github.com/Muljax/api/compare/v1.2.1...v1.3.0) (2026-09-20)


### Features

* **api:** add admin user sessions listing and revocation endpoints ([5f2b9d0](https://github.com/Muljax/api/commit/5f2b9d0991e14ff7e4e8b012ba4672fef9ca3d3f))
* **api:** add session latitude/longitude telemetry and admin session management endpoints ([24983ee](https://github.com/Muljax/api/commit/24983ee340714926ee3618987cefb076cde5582c))
* **api:** migrate account route group to @hono/zod-openapi and zod validation ([022edfe](https://github.com/Muljax/api/commit/022edfe7d41c8bf5945accdd12d4d2a16347a117))
* **api:** migrate admin and users route groups to @hono/zod-openapi and zod validation ([f9a252a](https://github.com/Muljax/api/commit/f9a252a4972bce112f28b5be0d5976628574c914))
* **api:** migrate auth route group to @hono/zod-openapi and zod validation ([7634fd4](https://github.com/Muljax/api/commit/7634fd4f0d9129e10a90330e5702493074c5dc63))
* **api:** migrate notifications route group to @hono/zod-openapi and zod validation ([db014b3](https://github.com/Muljax/api/commit/db014b3d1672e23b994e218462ce4fb2009e9508))
* **api:** migrate oauth and well-known route groups to @hono/zod-openapi and mount openapi spec ([2f167d0](https://github.com/Muljax/api/commit/2f167d05587b498d8c18c0c9c1fc89fb3932d5d4))
* **api:** migrate passkeys route group to @hono/zod-openapi and zod validation ([5d93875](https://github.com/Muljax/api/commit/5d938758e4e82548ef6fa710851084dda6337bfb))
* **api:** migrate ssh route group to @hono/zod-openapi and zod validation ([3fbaec8](https://github.com/Muljax/api/commit/3fbaec8a399fbc145c3c4c7add74c9b42698aba5))
* openapi doc in yaml ([2c29bfb](https://github.com/Muljax/api/commit/2c29bfb908068899744c46ab85a39de02b673854))


### Bug Fixes

* **api:** clean up auth password reset route paths in openapi ([3f9c87a](https://github.com/Muljax/api/commit/3f9c87a65f1cf1e66db2d5ad204e105b9dd86a45))

## [1.2.1](https://github.com/Muljax/api/compare/v1.2.0...v1.2.1) (2026-09-19)


### Bug Fixes

* **notifications:** sync cross-isolate SSE stream events with D1 and keepalive ([bce9398](https://github.com/Muljax/api/commit/bce9398a00174369eef01713e84fc6786fcf4e24))

## [1.2.0](https://github.com/Muljax/api/compare/v1.1.0...v1.2.0) (2026-09-19)


### Features

* **lifecycle:** support account deletion and delete lifecycle action ([ab9046a](https://github.com/Muljax/api/commit/ab9046ab38d3e51f01c7aeb69ce431862f39e09d))

## [1.1.0](https://github.com/Muljax/api/compare/v1.0.1...v1.1.0) (2026-09-19)


### Features

* **ssh:** support custom principal claims via rbac permissions ([e4e3c63](https://github.com/Muljax/api/commit/e4e3c6337b7cfe31ce8c419f790820eca861a571))

## [1.0.1](https://github.com/Muljax/api/compare/v1.0.0...v1.0.1) (2026-09-19)


### Bug Fixes

* **ssh:** use ascii byte strcmp to sort certificate options and extensions ([bc4f0db](https://github.com/Muljax/api/commit/bc4f0db08f8a138d845d2207c002624d8a561404))

## 1.0.0 (2026-09-19)


### Features

* actual enable/disable workflow support ([ab6a044](https://github.com/Muljax/api/commit/ab6a0444c4da6d9db8e734356d2e8a74300e8a69))
* add biome override to strip trailing commas from jsonc, run biome check, mount lifecycle route ([79d4bb1](https://github.com/Muljax/api/commit/79d4bb17497a6e3a646674207cf893bce4e7a040))
* add krl binary format ([9b40408](https://github.com/Muljax/api/commit/9b40408ca161127bda5a122a44e7f09d1594e866))
* add rateLimiter middleware and apply it to all auth endpoints ([fb0ffae](https://github.com/Muljax/api/commit/fb0ffaec2a81408ae16f778ca9603f918591a42b))
* add test lifecycle version ([38814aa](https://github.com/Muljax/api/commit/38814aa224e45b88ff71448b159ef63ef590f785))
* add usernameless passkey support, modify challenges table, update login / registration UI, introduce lucide ([c5d3ed2](https://github.com/Muljax/api/commit/c5d3ed269d1eefb54083bc2fc71b35c22c56f5f7))
* admin users page ([b4f967c](https://github.com/Muljax/api/commit/b4f967c1c0888a85020a66c73618d5844ec95bb8))
* **api:** return package version on health endpoint ([bb38dff](https://github.com/Muljax/api/commit/bb38dfffceba3f952f1518af2c3671d55bc5d1df))
* auth time in id token ([5344ff1](https://github.com/Muljax/api/commit/5344ff10ceecfc4d10285cfb3102138681355213))
* **auth,admin:** add instance access policies, invite tokens, and break-glass sign-in keys ([ecfa04c](https://github.com/Muljax/api/commit/ecfa04c8678483e5164468ab14b23f47d75257ff))
* basic lifecycle engine ([1a98d41](https://github.com/Muljax/api/commit/1a98d410a67359af1783fe48714890bb7e26d03f))
* **branding:** add dynamic instance name and custom logo support ([#198](https://github.com/Muljax/api/issues/198)) ([16eb082](https://github.com/Muljax/api/commit/16eb082897c3adfd3df579fc43769fa907518df1))
* cache control, discovery document update, more ([fe39aec](https://github.com/Muljax/api/commit/fe39aec916b3f697d4b0b47623f48aa44b9dc14d))
* **ci:** configure release-please monorepo manifest mode with 1.1.0 baseline ([21fa4f6](https://github.com/Muljax/api/commit/21fa4f6dc0839ce57420c00eedff03e21e52eac3))
* client secret basic advertised support ([032b4da](https://github.com/Muljax/api/commit/032b4da36f36d8eef2e91786ff1f13152286cb69))
* dashboard respects rbac ([a0dcee0](https://github.com/Muljax/api/commit/a0dcee060a3e457f64c89df17d1b86d3f2e3140a))
* **dashboard:** modularize user directory and support lifecycle scheduling ([#196](https://github.com/Muljax/api/issues/196)) ([681c5f5](https://github.com/Muljax/api/commit/681c5f530bc781daa55e42f3e70a5644cd1f9da3))
* delete clients endpoint and ui ([936dc35](https://github.com/Muljax/api/commit/936dc35dfd4f006b9024924327b76eca785ae65b))
* fix oauth flow ([#60](https://github.com/Muljax/api/issues/60)) ([a1d4a1e](https://github.com/Muljax/api/commit/a1d4a1ea01e593d957e107839dc7cd72609dd019))
* full profile scope support migration ([ee63c97](https://github.com/Muljax/api/commit/ee63c97b0b8fd7bdba7dac25ac47a7f2a4a4b320))
* implement engine to control schedulding semantics including timing conflicts ([d2f73b2](https://github.com/Muljax/api/commit/d2f73b2dfac4256c8ab1ee25bb4bc452c6b36716))
* include info in id token based on scope ([#63](https://github.com/Muljax/api/issues/63)) ([216563d](https://github.com/Muljax/api/commit/216563d075ae7fbeb37c1bc04b3733829d2f19c7))
* lifecycle action claiming ([d6e43f9](https://github.com/Muljax/api/commit/d6e43f99305db30246e8da42a2a7f1fb600ad0dc))
* lifecycle table ([b0481b1](https://github.com/Muljax/api/commit/b0481b1d028f66f6d8656dd2677e776df945208c))
* list users endpoint ([ac581dd](https://github.com/Muljax/api/commit/ac581dddbf94e0f7ecd1dd21f14c1239fab2cf11))
* lots of compliance change, new lib ([05760ad](https://github.com/Muljax/api/commit/05760ad667b1e4a46321795bbb927905d2849eb7))
* m2m oidc ([#184](https://github.com/Muljax/api/issues/184)) ([8f086d5](https://github.com/Muljax/api/commit/8f086d51750449713122155e0e2bf998763c8d2d))
* major dashboard overhaul ([bfe008f](https://github.com/Muljax/api/commit/bfe008f0c11f2d80b7750b239f3e915ef6d14299))
* migrate setup to alchemy, remove argon as a feature flag and only hashing algorithim ([dd409ca](https://github.com/Muljax/api/commit/dd409ca3be05c44c9d3e593db235a41d594d6594))
* migrate to terraform ([12a1921](https://github.com/Muljax/api/commit/12a192128067b39b76d4fb3eed3972651f62985d))
* more compliance changes, this implementation passes basic compliance checks ([3c5a2cf](https://github.com/Muljax/api/commit/3c5a2cfd33dc4287147ae8f988d0678e3a457c5e))
* move password endpoint under account route group ([4626c56](https://github.com/Muljax/api/commit/4626c56974459ef672381a8fc054d181eab7d550))
* nescessary claims ([#66](https://github.com/Muljax/api/issues/66)) ([f0395f1](https://github.com/Muljax/api/commit/f0395f17dc07795ce3968300eb30d98737f9c0cb))
* notification system and migration to new notification system ([#182](https://github.com/Muljax/api/issues/182)) ([95523c8](https://github.com/Muljax/api/commit/95523c8d0a10c40a8bae9c09751cc03bed3dbac6))
* organize auth routes ([def6bbe](https://github.com/Muljax/api/commit/def6bbe7be721bd56042a048010032797cef9c85))
* organize oauth routes ([5db70a7](https://github.com/Muljax/api/commit/5db70a71bb0522fdd36e101683cdc31fac685059))
* password change page, resolve some ts nonsense ([b2fdc80](https://github.com/Muljax/api/commit/b2fdc809e20dfda8190359f4d463c281b0661e57))
* password reset ([#187](https://github.com/Muljax/api/issues/187)) ([11173e6](https://github.com/Muljax/api/commit/11173e65c13c1632eaa46e90a042a159c39449b6))
* profile page organization, generic field component, routing fixes  in api ([#75](https://github.com/Muljax/api/issues/75)) ([6cb6ed7](https://github.com/Muljax/api/commit/6cb6ed7172c4f4d3f8f71fb885681619f83fd801))
* rbac ([#221](https://github.com/Muljax/api/issues/221)) ([fb7cdc5](https://github.com/Muljax/api/commit/fb7cdc58993e4cd7acbf16c4b20551936316d9a3))
* **rbac:** enforce permission dependencies and role cache invalidation ([ec37960](https://github.com/Muljax/api/commit/ec37960766a6b32f7e73ca5d5078b819e8e67c91))
* remember oauth auth choice ([#61](https://github.com/Muljax/api/issues/61)) ([af77745](https://github.com/Muljax/api/commit/af7774518cb17f618e0a60d8dd0fb0f4043e9ce6))
* reorganize admin routes ([d6d5955](https://github.com/Muljax/api/commit/d6d5955cf873c47a2fba9d5ec26b727568c00f42))
* reorganize passkeys routes ([89f5cbd](https://github.com/Muljax/api/commit/89f5cbdd410d8c659ff73d6ac646644c09884fea))
* reorganize well-known routes ([bea350c](https://github.com/Muljax/api/commit/bea350c1160f8a96dc177edf442d3572804df455))
* **repo:** initialize autonomous api repository with core docs, ci, and tooling ([a6db202](https://github.com/Muljax/api/commit/a6db202b73fa020a7015e16ec8f4523e522d3e53))
* seeding docs, seed cli client, allow loopback redirect URIs on any port ([c08f6b7](https://github.com/Muljax/api/commit/c08f6b703b903882e5cebd2af589e2186f21b7d8))
* split up api library, move passkey login function to login.tsx ([21d3844](https://github.com/Muljax/api/commit/21d3844420a2af14cdf6c01f4f5c7a33885e9f73))
* ssh ca ([de44395](https://github.com/Muljax/api/commit/de4439536a079f5129a9203ef89f63941f696d12))
* **ssh:** add cleanup job that removes expired certificates whether or not they are revoked ([f5a9d8d](https://github.com/Muljax/api/commit/f5a9d8d8a5988a46ae8694e08cd0f5782144245a))
* start reorgnizing routes ([e1cf011](https://github.com/Muljax/api/commit/e1cf011c5667bed309f5f569b5ddd337419e6b3d))
* support client secret basic ([6100004](https://github.com/Muljax/api/commit/61000044277c3406b54588dc1afd6528c40031ee))
* support max age ([c47fbe6](https://github.com/Muljax/api/commit/c47fbe611a7b62731c179e54e54ad42983bfd57c))
* support post  auth, fix redirect bug ([e77936e](https://github.com/Muljax/api/commit/e77936eea2e42d0e31a5e093adf8e6317d0ec298))
* support prompts ([0e532a9](https://github.com/Muljax/api/commit/0e532a9b2e3de298f5c6e888248392b626d45dc7))
* suppport acr values ([970f80c](https://github.com/Muljax/api/commit/970f80c9831847e0da7f212adf877662d14ce7d7))
* **types:** export canonical schema and DTO types and add downstream dashboard CI check ([fc7e017](https://github.com/Muljax/api/commit/fc7e0176c46d3ed57565a0aaaabca377ed91eeb3))
* ui changes to passkeys page, fix bugs that caused a user to be unable to register a passkey due to usernameless passkeys implementation ([bfca40d](https://github.com/Muljax/api/commit/bfca40d3a0455c446bcf8dfc8d28a6789c383f44))
* user lifecycle create endpoint ([030c881](https://github.com/Muljax/api/commit/030c8817dd09737ceaa02ea347ab6509a233f482))
* users avatar endpoint, various fixes ([#88](https://github.com/Muljax/api/issues/88)) ([ed618fb](https://github.com/Muljax/api/commit/ed618fbee31ab74a20558052ac0da52432772c52))
* verify response type in oauth flow, update ui for authorized apps and authorization page ([1b8216b](https://github.com/Muljax/api/commit/1b8216b292f92a45023fe6bb420526fee4b42e65))


### Bug Fixes

* actually store auth time ([987316e](https://github.com/Muljax/api/commit/987316efd36b55bcd3d3ef7a4870b875b6cd082f))
* add acr claim ([a2c0563](https://github.com/Muljax/api/commit/a2c0563da4bdcdd459335d1434fbdf22b0f4a04e))
* add the UI for selecting and adding custom scopes to clients ([#236](https://github.com/Muljax/api/issues/236)) ([34f4c0a](https://github.com/Muljax/api/commit/34f4c0ac8f50572bc2525083d862841d057cb17a))
* advertise none supported request signing alg ([c54e5f2](https://github.com/Muljax/api/commit/c54e5f263d6e51336f3666325644ce604d3bfb30))
* **api:** support raw text negotiation and pubkey alias for ssh ca public key ([787f274](https://github.com/Muljax/api/commit/787f27405cb0ff128b3d241728f32051b1a081ad))
* auth bypass and unauthenticated endpoints ([#157](https://github.com/Muljax/api/issues/157)) ([5fc5f2b](https://github.com/Muljax/api/commit/5fc5f2bd0d749df43a6b489495d51c66a91dfe2d))
* **auth:** make password reset token consumption atomic to prevent replay and race conditions ([fc4eed9](https://github.com/Muljax/api/commit/fc4eed91f2ee3b64803a267b02167c664a0081f2))
* **auth:** prevent passkey idor and enforce user disablement ([56fadd2](https://github.com/Muljax/api/commit/56fadd2bc08fa13f1539aa6d0b8bedbdeeaff493))
* **auth:** prevent race conditions in single-use invite token registration ([006a116](https://github.com/Muljax/api/commit/006a116dac21cb3d017088d633ba35db430886d0))
* **auth:** resolve double sign-in and cookie session persistence ([#213](https://github.com/Muljax/api/issues/213)) ([4150dbc](https://github.com/Muljax/api/commit/4150dbcc0d184938d4e42968f59541ddc7b5af23))
* **auth:** restrict OAuth tokens to granted scopes and guard account mutations ([#233](https://github.com/Muljax/api/issues/233)) ([7bbbdae](https://github.com/Muljax/api/commit/7bbbdae9ff6e4824874b8bc768cb1aaadc8ec326))
* **auth:** tighten cookie sameSite to Lax and add origin validation on oauth consent ([0b6a1bd](https://github.com/Muljax/api/commit/0b6a1bd0ee98ca8400b450d7c3497445a3cf26f2))
* **auth:** tune rate limiter scope and issue session on registration ([4f36f79](https://github.com/Muljax/api/commit/4f36f799f4dc1912d8393ba3a8b6c3f54aa54ad9))
* **build:** bundle and upload wasm modules alongside api worker script ([7732a21](https://github.com/Muljax/api/commit/7732a212c3620798ee168cf6e255505451ca4752))
* **crypto:** resolve illegal invocation in timingSafeEqual ([#216](https://github.com/Muljax/api/issues/216)) ([d7918e3](https://github.com/Muljax/api/commit/d7918e385af43901cda724dd17302ec5b65bb067))
* **db:** update D1 initialization for Drizzle 1.0 RC ([f982f92](https://github.com/Muljax/api/commit/f982f92d117cd49ce567d61107175c80cedc2212))
* default case is now error, move execution into engine.ts ([dd09f93](https://github.com/Muljax/api/commit/dd09f932b67cb15cae61a283feb39ba61939febc))
* **deps:** update dependency @types/node to v26.4.1 ([e1e46b8](https://github.com/Muljax/api/commit/e1e46b846295a229c445d8ed1f3f7532ad16ad92))
* **deps:** update dependency @types/node to v26.5.1 ([91110f4](https://github.com/Muljax/api/commit/91110f40da2b7a8bcb6022562559e28295eb32a8))
* **deps:** update dependency drizzle-orm to v1.0.0-rc.5-ab785fc ([d869222](https://github.com/Muljax/api/commit/d8692223a2ce311825bd21e0e835fb79745699eb))
* **deps:** update dependency hono to v4.13.7 ([2f95c06](https://github.com/Muljax/api/commit/2f95c06d3b379248ccbc21b5b69e8c34f5305a4a))
* **deps:** update dependency hono to v4.13.8 ([#189](https://github.com/Muljax/api/issues/189)) ([bf42a9c](https://github.com/Muljax/api/commit/bf42a9cddffb6dc79fe4b4fcb93275a8f5d26472))
* fix typo in openid config ([7225315](https://github.com/Muljax/api/commit/72253158ab789b7d676855795e57d262f33eeb75))
* guard against a workflow not corresponding to any lifecycle_actions row ([e51eb49](https://github.com/Muljax/api/commit/e51eb49d24ce37d8cf01a48315706104fd238828))
* **infra:** resolve localhost truthiness bug, align wrangler configs, and wire migration variables ([6286ec8](https://github.com/Muljax/api/commit/6286ec88d64038eff7f933ab69ffb3686b294622))
* **invites:** enforce caller permission ceiling on invite token creation ([96a72c9](https://github.com/Muljax/api/commit/96a72c938281a630358fb2065e997ea5de0a62cf))
* **lifecycle:** revoke active ssh certificates upon user deactivation ([ab4b7c3](https://github.com/Muljax/api/commit/ab4b7c33bdc977ae9bce52596e08c3cc2dd6e9b8))
* limit passwords to 128 characters to prevent CPU exhaustion DoS ([#178](https://github.com/Muljax/api/issues/178)) ([e9dec3b](https://github.com/Muljax/api/commit/e9dec3b077350bdd8e2ec28589354ee739908310))
* **oauth:** enable public cors, persist consent grants, and secure authorization redirects ([8caab95](https://github.com/Muljax/api/commit/8caab9525d46d9460ccbd3e63c2214e86bf72646))
* **oauth:** enforce atomic token exchanges, token reuse detection, and public client pkce ([ae1d426](https://github.com/Muljax/api/commit/ae1d42645801fecd87678a055e1410a35b4703d1))
* **oauth:** redirect authorization errors to valid redirect_uri per rfc6749 ([8d6f890](https://github.com/Muljax/api/commit/8d6f890e32b3b1d3d72b04125b2c5c409c7f99e3))
* **oauth:** respect sign in policy ([4ed2f68](https://github.com/Muljax/api/commit/4ed2f683ff06f6e67addc281cfc8d333fdbdb44a))
* **oauth:** revoke access tokens when authorization codes are reused ([e478313](https://github.com/Muljax/api/commit/e478313484adfc2f8a6aa45cf497ead4034035ba))
* **oauth:** revoke refresh tokens on code reuse and gate id_token on openid scope ([8a74800](https://github.com/Muljax/api/commit/8a74800bb3a9a4c7f9a98403e9ece0b818f76118))
* **oidc:** add revocation and introspection endpoints to openid discovery ([8f9cd98](https://github.com/Muljax/api/commit/8f9cd98231b197f53528bc22bb70a512c61d9685))
* **oidc:** enforce openid scope requirement on userinfo endpoint ([985ec1f](https://github.com/Muljax/api/commit/985ec1fb8d30812eda0108b2c21f3c0269eef9d5))
* **oidc:** return consent_required on prompt=none when consent is missing ([8e35941](https://github.com/Muljax/api/commit/8e359419e27f1f113e5bf3deda227e7aeff4a117))
* provide authorization code ID ([4c30e69](https://github.com/Muljax/api/commit/4c30e6916e62b09647d12300125648d5e8100e06))
* provide storedToken.id to createAccessToken ([ac88c44](https://github.com/Muljax/api/commit/ac88c4425c0e11dd72b1e96d43efba8ec6ee1142))
* **rbac:** enforce permission ceiling on role assignment and role modification ([faebd4e](https://github.com/Muljax/api/commit/faebd4ef3136c3de24c7c06bd2aad32e5f06cb8e))
* **rbac:** reference SYSTEM_ROLE_IDS.ADMIN constant consistently ([0993105](https://github.com/Muljax/api/commit/0993105051559a7a58f424978c0f6a6a8f637311))
* **rbac:** support multi-level hierarchical wildcards in permission matcher ([c159549](https://github.com/Muljax/api/commit/c159549f77ebe0fba0503e0f01061418a797a877))
* reconcile database row if workflow creation fails ([f128a95](https://github.com/Muljax/api/commit/f128a9538a1a986d07dcc054396553ca21640af7))
* return 409 on username collision ([ad247a5](https://github.com/Muljax/api/commit/ad247a5cb2f81b83d8a8d9572ec76d4232bd6385))
* return proper error if response code is missing ([a2ce175](https://github.com/Muljax/api/commit/a2ce1759599a0572be315bfc50f06c9da6bd9058))
* **security:** constant-time equality, user enumeration mitigation, and atomic passkeys ([5a5b6f1](https://github.com/Muljax/api/commit/5a5b6f1b0f43a002b6604c570a66bec80a04cdb2))
* seperate execution failure from completion persistence ([cbed9c6](https://github.com/Muljax/api/commit/cbed9c616b024fba1b651d79fe8d4f120440149c))
* some cleanup ([#181](https://github.com/Muljax/api/issues/181)) ([d456781](https://github.com/Muljax/api/commit/d456781ec83d7526e65a9917ee280a90b66c3ee7))
* **ssh:** sort critical options lexicographically and wrap inner option strings ([53652ec](https://github.com/Muljax/api/commit/53652ece12c7a98c14888b34e0548b97df7cb95e))
* validate body properly ([825142f](https://github.com/Muljax/api/commit/825142f4e99a8637d57f5532e1de9c35d2165ede))
* validate emails during signup ([#180](https://github.com/Muljax/api/issues/180)) ([094c6af](https://github.com/Muljax/api/commit/094c6af2e52600ac85ba51d05fcf8a3b4787df39))


### Performance Improvements

* background expired session deletion ([#208](https://github.com/Muljax/api/issues/208)) ([6fef801](https://github.com/Muljax/api/commit/6fef80137002320000e90e8a21c032340e71770b))
* set argon2id memory alloc to 19mb ([#210](https://github.com/Muljax/api/issues/210)) ([d916206](https://github.com/Muljax/api/commit/d916206f15ff3374fc4786a21fe2834ab24c51c3))
* use javascript native toHex ([#211](https://github.com/Muljax/api/issues/211)) ([132e055](https://github.com/Muljax/api/commit/132e055bfdb3585c39905f1324da65b085ef0576))
* use native base64 and timingSafeEqual methods ([#212](https://github.com/Muljax/api/issues/212)) ([f07816d](https://github.com/Muljax/api/commit/f07816d2dba77dd38bbb93c54092d2cee358ed91))

## [1.2.0](https://github.com/Muljax/id/compare/api-v1.1.1...api-v1.2.0) (2026-09-19)


### Features

* **api:** return package version on health endpoint ([b7f7dde](https://github.com/Muljax/id/commit/b7f7dde8380bb7be339c27779083193d86fca30d))

## [1.1.1](https://github.com/Muljax/id/compare/api-v1.1.0...api-v1.1.1) (2026-09-19)


### Bug Fixes

* **api:** support raw text negotiation and pubkey alias for ssh ca public key ([62859f1](https://github.com/Muljax/id/commit/62859f179632397847d69841c3940e7ff674192a))
