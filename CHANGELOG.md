# Changelog

## [2.0.0](https://github.com/Muljax/id/compare/root-v1.1.0...root-v2.0.0) (2026-09-19)


### ⚠ BREAKING CHANGES

* release 1.0.0 and update core repository documentation

### Features

* actual enable/disable workflow support ([9bff065](https://github.com/Muljax/id/commit/9bff065a88a01e2acea646e20f073b5d9d03260c))
* add base for rate limiting ([94cc6da](https://github.com/Muljax/id/commit/94cc6da53b4adc11b58e93df19da62ee8f4abfb7))
* add biome override to strip trailing commas from jsonc, run biome check, mount lifecycle route ([6ae6bb1](https://github.com/Muljax/id/commit/6ae6bb1484179320c84ae829802b1364d3ec398f))
* add CF workflows binding to wrangler seutp script ([e78b663](https://github.com/Muljax/id/commit/e78b66395fcfe1953c43a3d410d83f193539bde6))
* add krl binary format ([f615e9f](https://github.com/Muljax/id/commit/f615e9f93e54598a8e0e57132438bc2739e42a9c))
* add passkey registraion and management UI ([#12](https://github.com/Muljax/id/issues/12)) ([937d453](https://github.com/Muljax/id/commit/937d4538549731e58c870e46b36d6e2b5bb1f8af))
* add r2 setup script, update refs ([0e856f3](https://github.com/Muljax/id/commit/0e856f39e31d56944c40e39a07d19ec1e35070f4))
* add rateLimiter middleware and apply it to all auth endpoints ([2eee1ce](https://github.com/Muljax/id/commit/2eee1cee00bea465e5f9377f3f3230d22542d9c5))
* add route data, update sidebar, document navigation lib ([4557f37](https://github.com/Muljax/id/commit/4557f377e4f082e0cdb7a2d98bf66afc7c5f81cb))
* add simple auth ratelimiter to wrangler config generation ([e9d8ef4](https://github.com/Muljax/id/commit/e9d8ef4654a70207eff0a935aeb8110396a088d7))
* add test lifecycle version ([0632094](https://github.com/Muljax/id/commit/06320943ed5f0d66e54f7a6f3748bdcc1e233f44))
* add usernameless passkey support, modify challenges table, update login / registration UI, introduce lucide ([d8e72bd](https://github.com/Muljax/id/commit/d8e72bded6cfb68d764ee447db58c64e7a2de75f))
* admin users page ([1737a4a](https://github.com/Muljax/id/commit/1737a4a8592b30f92e99118168d6b212104d5f7d))
* also mobile sidebar ([93ed9d6](https://github.com/Muljax/id/commit/93ed9d680a07973396c165b7bd7a25fe4748d8dd))
* api stuff, apistatus component, run biome checker and formatter ([29845ad](https://github.com/Muljax/id/commit/29845ad418a767245c4999d2ce9538ff8c38f0f9))
* auth time in id token ([2a09950](https://github.com/Muljax/id/commit/2a09950391b033566812f49654b16a808373f915))
* **auth,admin:** add instance access policies, invite tokens, and break-glass sign-in keys ([e4efc87](https://github.com/Muljax/id/commit/e4efc87373c7af3331fc91b83dcd3d1349dc25cb))
* basic components and stuff ([3228d57](https://github.com/Muljax/id/commit/3228d57754321dc470fbb3b3cda055b9a1fbfc66))
* basic lifecycle engine ([06d3137](https://github.com/Muljax/id/commit/06d31372004031a3e98719468afdfaf79d464cc7))
* better profile page ([39f1de1](https://github.com/Muljax/id/commit/39f1de1f36fc4d429eab5c63fae18e77eca47a33))
* **branding:** add dynamic instance name and custom logo support ([#198](https://github.com/Muljax/id/issues/198)) ([afd0907](https://github.com/Muljax/id/commit/afd0907693e11cb4ff50a54c5c1e1657f9525a31))
* cache control, discovery document update, more ([92aabbd](https://github.com/Muljax/id/commit/92aabbdff33e839d49cb874582dae3343e84a8d6))
* **ci:** configure release-please monorepo manifest mode with 1.1.0 baseline ([3898ca9](https://github.com/Muljax/id/commit/3898ca952084d4fbcf60c9d4580396b9936bcdba))
* clean up scripts, use shared utils, generate build state ([63ad8cb](https://github.com/Muljax/id/commit/63ad8cb2b2fcbac38efa86abf6aa1841665fd8c5))
* client secret basic advertised support ([59c0a9a](https://github.com/Muljax/id/commit/59c0a9a0df1f5f0068e8f53640273470e4c0ae0f))
* dashboard deployment, env file and support for dashboard, ([fcdbef6](https://github.com/Muljax/id/commit/fcdbef6ec594e65b2e8631d15e0161c7aa6a3276))
* dashboard respects rbac ([d39ff97](https://github.com/Muljax/id/commit/d39ff976c692e99fe2e5d183c42566dde6a73dd5))
* dashboard stying update, several fixes ([#15](https://github.com/Muljax/id/issues/15)) ([9483ac8](https://github.com/Muljax/id/commit/9483ac8c8a9c0c9d2e8a120cb376d7cddc2fb58a))
* **dashboard:** adopt @tanstack/react-form across all dashboard views ([#203](https://github.com/Muljax/id/issues/203)) ([27bfe44](https://github.com/Muljax/id/commit/27bfe44f41d6309168e193f58d6426783fc44f50))
* **dashboard:** adopt @tanstack/react-query for state management and caching ([#205](https://github.com/Muljax/id/issues/205)) ([02a597c](https://github.com/Muljax/id/commit/02a597c14254b321ce71f972b4b8c0535fc7f006))
* **dashboard:** modularize user directory and support lifecycle scheduling ([#196](https://github.com/Muljax/id/issues/196)) ([9b79503](https://github.com/Muljax/id/commit/9b79503e4ba87462029d8b51af1fccc7eabd3492))
* delete clients endpoint and ui ([ef3bf8b](https://github.com/Muljax/id/commit/ef3bf8b7c742094748f4ecd7626522f7ccd3bee5))
* display the build version of the app on the dashboard ([3c71f94](https://github.com/Muljax/id/commit/3c71f940f2105f8862201c525e05f6d2f2a047c5))
* docs, ssh ca admin ui update ([2103173](https://github.com/Muljax/id/commit/2103173d7fdca31841fad37d7f0b0bb51d5469d2))
* dynamic tab titles ([#200](https://github.com/Muljax/id/issues/200)) ([a185401](https://github.com/Muljax/id/commit/a185401b0a935575fc3307761463cc6d49c1e66d))
* experimental support for argon2id password hashing ([2787ae9](https://github.com/Muljax/id/commit/2787ae97d1b028881f6d1a15f19c49be340743f3))
* fix issue sync body section ([8f2c134](https://github.com/Muljax/id/commit/8f2c134279a741c07f596fdb75d429f923ce026b))
* fix oauth flow ([#60](https://github.com/Muljax/id/issues/60)) ([d0cc658](https://github.com/Muljax/id/commit/d0cc658548fb8bed351eb54cb6c25e4c32d08dfa))
* full profile scope support migration ([16a1868](https://github.com/Muljax/id/commit/16a18680eb081fc1144a0f137b3ca9b4821ddfe6))
* generate dashboard config, update passkeys route to use workers env, setup generates worker types ([5f405c6](https://github.com/Muljax/id/commit/5f405c6af8e3b3185df9a677ff6ee1a04b37ffa0))
* hide admin routes from sidebar ([90ac6c6](https://github.com/Muljax/id/commit/90ac6c657da9d73246f962b771d08facf3fcd853))
* hide admin routes from sidebar ([ac865fe](https://github.com/Muljax/id/commit/ac865fe80a4e6866da98b49f3bdafe276916c147))
* implement engine to control schedulding semantics including timing conflicts ([46b9b7c](https://github.com/Muljax/id/commit/46b9b7cd667efaf28811e86ec1126ec1c2448155))
* include build info in sidebar ([2885142](https://github.com/Muljax/id/commit/2885142f5ef2a82b1a05f675d119565fd78352a4))
* include info in id token based on scope ([#63](https://github.com/Muljax/id/issues/63)) ([d9b3219](https://github.com/Muljax/id/commit/d9b3219edc24c387e27887d5016fddc4ca8b22cf))
* instance settings schema and migration, flagship setup script ([77b645d](https://github.com/Muljax/id/commit/77b645dd652fa9ec605286e9b576e92d8dd755e8))
* lifecycle action claiming ([afb953a](https://github.com/Muljax/id/commit/afb953a78dec1051ac5aa94eadc6e341c3842832))
* lifecycle table ([9788a8c](https://github.com/Muljax/id/commit/9788a8cac3c72c306b4faad83932edc3d7fde61e))
* list users endpoint ([73d0990](https://github.com/Muljax/id/commit/73d099068bbccc510729bae8bd7137ef85d49d7f))
* lots of compliance change, new lib ([195bc14](https://github.com/Muljax/id/commit/195bc1481b77bd7a077ecd0524b411a44a4db41e))
* m2m oidc ([#184](https://github.com/Muljax/id/issues/184)) ([e3541cc](https://github.com/Muljax/id/commit/e3541cc7d350898bcc1765a1f4c2488cd2a21661))
* major dashboard overhaul ([29789a5](https://github.com/Muljax/id/commit/29789a5756ff3389cf741ac4660f6e9886e38fcc))
* migrate setup to alchemy, remove argon as a feature flag and only hashing algorithim ([732a6fb](https://github.com/Muljax/id/commit/732a6fbda35fc40f0cfe221b3a52bd01c861fcb3))
* migrate to alchemy ([#16](https://github.com/Muljax/id/issues/16)) ([b1b7454](https://github.com/Muljax/id/commit/b1b74542b5900c9a5c8b41d57e3748c4d5b8aee5))
* migrate to terraform ([5c38823](https://github.com/Muljax/id/commit/5c38823c74ab95d0d9fe8946549fd7206c0e6bc1))
* more auth stuff ([ef8832c](https://github.com/Muljax/id/commit/ef8832cf003341f6be3c08879133f8d170de0f83))
* more basic components and organization ([95168dd](https://github.com/Muljax/id/commit/95168dd941817a488ccb1d9eaf993eefad06f09e))
* more compliance changes, this implementation passes basic compliance checks ([1a73b62](https://github.com/Muljax/id/commit/1a73b62e233946d3e83624699f38d68ac4545e15))
* move password endpoint under account route group ([9549d24](https://github.com/Muljax/id/commit/9549d24cce1a5a1a8755d5fd28f2c8c9b7e9e7bc))
* nescessary claims ([#66](https://github.com/Muljax/id/issues/66)) ([8acdcfb](https://github.com/Muljax/id/commit/8acdcfb64a5cff41a5bd4b615e7c43af07de3243))
* notification system and migration to new notification system ([#182](https://github.com/Muljax/id/issues/182)) ([a8d0fa8](https://github.com/Muljax/id/commit/a8d0fa828f5888c3466e770f9085797d924382b2))
* organize auth routes ([0510e49](https://github.com/Muljax/id/commit/0510e495e7638aec64f5986e3ba8e31190f1b6df))
* organize oauth routes ([5b0f6cf](https://github.com/Muljax/id/commit/5b0f6cf70a8d7941029969470fa7b1cb659454db))
* organize profile page ([f2961e4](https://github.com/Muljax/id/commit/f2961e482941abbefa5f261fcb32dbcc1a7cb604))
* passkey registration UI ([5721916](https://github.com/Muljax/id/commit/5721916dc07519ce3340ce28fae87ca7b141f5d2))
* passkeys ([a41f8e9](https://github.com/Muljax/id/commit/a41f8e9a6ad47ccbd3cc0a783b71c661de60f7be))
* passkeys management ui ([9d37f68](https://github.com/Muljax/id/commit/9d37f688dc52e1d87f3a0120a5e1a5df3060dd20))
* password change page, resolve some ts nonsense ([4c8b7d4](https://github.com/Muljax/id/commit/4c8b7d4f60ad50e040498d977c3ba986d8cac4a6))
* password reset ([#187](https://github.com/Muljax/id/issues/187)) ([50da541](https://github.com/Muljax/id/commit/50da5411d4e8e2f9d5ad1201996ca2dee2cd11e6))
* profile page organization, generic field component, routing fixes  in api ([#75](https://github.com/Muljax/id/issues/75)) ([0e73b7e](https://github.com/Muljax/id/commit/0e73b7e40ea6983457978ccbedddc163604dcc04))
* rbac ([#221](https://github.com/Muljax/id/issues/221)) ([58d517a](https://github.com/Muljax/id/commit/58d517a2793e6049967805809998dc5bd77870ec))
* **rbac:** enforce permission dependencies and role cache invalidation ([8a1b349](https://github.com/Muljax/id/commit/8a1b3490fa78ddfd9cc057592537deb0b9e2af40))
* release 1.0.0 and update core repository documentation ([b7781a1](https://github.com/Muljax/id/commit/b7781a16222c57ec3b1ca8c020b4207ddf767e98))
* remember oauth auth choice ([#61](https://github.com/Muljax/id/issues/61)) ([5433360](https://github.com/Muljax/id/commit/543336090fb71deeba4e1e2e801155010d0a3d3b))
* reorganize admin routes ([8cc1b8b](https://github.com/Muljax/id/commit/8cc1b8b9b2073a2a531735ee7e12614ccfacdedc))
* reorganize passkeys routes ([6aecabe](https://github.com/Muljax/id/commit/6aecabee8e26350bc7675233d24dbcba5308a9bc))
* reorganize well-known routes ([d4a4c36](https://github.com/Muljax/id/commit/d4a4c36680ba63af68be1208132b497c7fdffa04))
* seeding docs, seed cli client, allow loopback redirect URIs on any port ([a77f92d](https://github.com/Muljax/id/commit/a77f92de3b797a857cd77f9dbf990888a18f4a56))
* setup generates wrangler.jsonc with required secret ([7ee2b4a](https://github.com/Muljax/id/commit/7ee2b4a9e980f08f3f215050d44e759563474d6a))
* split up api library, move passkey login function to login.tsx ([3463acd](https://github.com/Muljax/id/commit/3463acd4a46314ff4aaa72e8fbc5e2bd37d2563a))
* ssh ca ([e5fbb4a](https://github.com/Muljax/id/commit/e5fbb4a98ad12e2dd18b7d9b1d5be787f42cabae))
* **ssh:** add cleanup job that removes expired certificates whether or not they are revoked ([c97a509](https://github.com/Muljax/id/commit/c97a509edd9b44ef8a15ca6a34dfe763a2d2cc76))
* start reorgnizing routes ([5b55cb1](https://github.com/Muljax/id/commit/5b55cb1dd9208a5e8c69437bd2421701283427db))
* support client secret basic ([ca1d358](https://github.com/Muljax/id/commit/ca1d3584c85ea4cb4d3428e9586ca84b57e45212))
* support completely hidden routes, mark bootstrap page as hidden ([252fd34](https://github.com/Muljax/id/commit/252fd34c1ef57c31b2a65456bd4c5d7c1b152c78))
* support max age ([1ea09d0](https://github.com/Muljax/id/commit/1ea09d0878609962b88f4eacf79420aa7f00c8a0))
* support post  auth, fix redirect bug ([90ec954](https://github.com/Muljax/id/commit/90ec954a0671d3a0c3a0bc89ae75ea51ab812631))
* support prompts ([106b3f7](https://github.com/Muljax/id/commit/106b3f721dfe265b36fa161bf310f24eb2336cc1))
* suppport acr values ([2839110](https://github.com/Muljax/id/commit/2839110bddea09ee2e8180c81f3444e63ed5257f))
* sync issue comments too ([aebf3d6](https://github.com/Muljax/id/commit/aebf3d6753ca11d3ffc250d6141701456aa2e87b))
* ui changes to passkeys page, fix bugs that caused a user to be unable to register a passkey due to usernameless passkeys implementation ([ff4436a](https://github.com/Muljax/id/commit/ff4436a326c3c2e2b983a19f56099be5d59ddba6))
* update auth stuff, abstract cookies, add auth provider ([84b3642](https://github.com/Muljax/id/commit/84b36420874f2c8ba946ee24d8b5997500821fbc))
* update import formatting, create migration for better session info and user management, clean up sessions endpoints ([f960f99](https://github.com/Muljax/id/commit/f960f99fb328eea4ac9db2eda5e27864574378a6))
* update passowrd page to include same password validation, change remove passkey styling in passkeys page ([ef94ad6](https://github.com/Muljax/id/commit/ef94ad6d33d71779f7e965b9fe3c3fcb90dc4f6a))
* update routing for security pages, use individual pages, update wrangler ([24c5cb1](https://github.com/Muljax/id/commit/24c5cb1bf40fbbf16d0ae5eaeef2d1e1b7818d4e))
* user lifecycle create endpoint ([cf27a49](https://github.com/Muljax/id/commit/cf27a4941b9f3dc6492f10321975576b246b10af))
* usernameless passkey login, ui updates for login/registration, fix for white screen flashbangs between reloads ([#13](https://github.com/Muljax/id/issues/13)) ([9872472](https://github.com/Muljax/id/commit/987247250193452971e34db41bd74a6003fc6368))
* users avatar endpoint, various fixes ([#88](https://github.com/Muljax/id/issues/88)) ([876bdff](https://github.com/Muljax/id/commit/876bdff54bb917a82dd2ee0326bc319036a1926f))
* verify response type in oauth flow, update ui for authorized apps and authorization page ([e8ea694](https://github.com/Muljax/id/commit/e8ea694e69afe2e34bd16d627054786d55dff9e0))


### Bug Fixes

* actually store auth time ([0f6b7d3](https://github.com/Muljax/id/commit/0f6b7d311506f22d60f2c46280845e25e8fa3545))
* add acr claim ([644015c](https://github.com/Muljax/id/commit/644015ce36a4791a867043b8ac345c8aa22a476f))
* add an inline password length error ([6765afa](https://github.com/Muljax/id/commit/6765afac0662638cfca123234fae8a993c12356f))
* add an inline password length error ([63d8c55](https://github.com/Muljax/id/commit/63d8c5561c7742f2dd6cf02857ec78708f82715b))
* add the UI for selecting and adding custom scopes to clients ([#236](https://github.com/Muljax/id/issues/236)) ([50812af](https://github.com/Muljax/id/commit/50812af626c538206eb99555a92b66297c299c51))
* advertise none supported request signing alg ([22d1dd2](https://github.com/Muljax/id/commit/22d1dd2ed6bff88943a81cec92e6260ae5b64421))
* auth bypass and unauthenticated endpoints ([#157](https://github.com/Muljax/id/issues/157)) ([15ac6dd](https://github.com/Muljax/id/commit/15ac6dd5f220c6051fb7fec28fdc5d6c4a879526))
* **auth:** make password reset token consumption atomic to prevent replay and race conditions ([86ab445](https://github.com/Muljax/id/commit/86ab445cfcc6b4b3cb06b0a7b59936c5ec8dc9fd))
* **auth:** prevent passkey idor and enforce user disablement ([4e470cc](https://github.com/Muljax/id/commit/4e470cc0ade35a4c57308602a778dbf1a847f895))
* **auth:** prevent race conditions in single-use invite token registration ([42d69b2](https://github.com/Muljax/id/commit/42d69b28e8d0b2aea45fed498adde816a50ba28f))
* **auth:** resolve double sign-in and cookie session persistence ([#213](https://github.com/Muljax/id/issues/213)) ([cfcfc8f](https://github.com/Muljax/id/commit/cfcfc8ff6309bd9cccf8c1ced26a19cd772f7169))
* **auth:** restrict OAuth tokens to granted scopes and guard account mutations ([#233](https://github.com/Muljax/id/issues/233)) ([feec962](https://github.com/Muljax/id/commit/feec962de4dfa3a8ef590718d5dadd081b57d01a))
* **auth:** tighten cookie sameSite to Lax and add origin validation on oauth consent ([daf2d74](https://github.com/Muljax/id/commit/daf2d74fa3e43fb7277bb1007b7932cf86317ab1))
* **auth:** tune rate limiter scope and issue session on registration ([5b72d97](https://github.com/Muljax/id/commit/5b72d9757f68f586ae4d1cde264ca536bda8c4e1))
* **build:** bundle and upload wasm modules alongside api worker script ([25bc094](https://github.com/Muljax/id/commit/25bc09485cb45ca0b78f74b244c425f5afaaf221))
* bust admin user avatar cache ([e3de255](https://github.com/Muljax/id/commit/e3de255daf19dd21a5e1afb4a5a87457cd2e8e9a))
* **ci:** write OSV SARIF output to workspace ([5db9891](https://github.com/Muljax/id/commit/5db9891a6fa084c46c0b15676f8e05fc9dcd3edf))
* **crypto:** resolve illegal invocation in timingSafeEqual ([#216](https://github.com/Muljax/id/issues/216)) ([36de80a](https://github.com/Muljax/id/commit/36de80a719ca9f67f369259806f4ab35043235d5))
* **dashboard:** correct root error component typing ([13e20b7](https://github.com/Muljax/id/commit/13e20b71f8d023b6032dab067570879440a47f41))
* **db:** update D1 initialization for Drizzle 1.0 RC ([018f5e3](https://github.com/Muljax/id/commit/018f5e317d1bc4a3cb529665fad7cbefb0b6074d))
* default case is now error, move execution into engine.ts ([2a68909](https://github.com/Muljax/id/commit/2a6890984f8c5e69ee129343f5ada3d0d43d0ab4))
* **deps:** update dependency @simplewebauthn/browser to v14 ([ce276b6](https://github.com/Muljax/id/commit/ce276b62b3b956e17b7cb37382a9a0632a9b80aa))
* **deps:** update dependency @simplewebauthn/server to v14 ([#30](https://github.com/Muljax/id/issues/30)) ([b95d8ac](https://github.com/Muljax/id/commit/b95d8ac8a8a82c25806d0e80c25ce7ba865b0f09))
* **deps:** update dependency @simplewebauthn/server to v14.0.1 ([735b0cc](https://github.com/Muljax/id/commit/735b0cca010bc733a602eeec9f90ca4709f93fa1))
* **deps:** update dependency @simplewebauthn/server to v14.0.2 ([5f1577e](https://github.com/Muljax/id/commit/5f1577e55f3341d277195d552e788d7bed6f4b22))
* **deps:** update dependency @types/node to v26.4.1 ([f13645b](https://github.com/Muljax/id/commit/f13645bf09cc18229d10d64fc619990e0192eddd))
* **deps:** update dependency @types/node to v26.5.1 ([fca1ca7](https://github.com/Muljax/id/commit/fca1ca725cdd2e60b25b833cf74b829d1b843ab3))
* **deps:** update dependency drizzle-orm to v1.0.0-rc.5-ab785fc ([e5b3825](https://github.com/Muljax/id/commit/e5b38256dcf95b4ea5b299b71bdaf67e937bf2a9))
* **deps:** update dependency hono to v4.13.7 ([8be90b7](https://github.com/Muljax/id/commit/8be90b738a522018e6346b4cfdb07cffdbc78a78))
* **deps:** update dependency hono to v4.13.8 ([#189](https://github.com/Muljax/id/issues/189)) ([14a11b5](https://github.com/Muljax/id/commit/14a11b53d515898bbbba82ac924936e0d1d04df8))
* **deps:** update dependency lucide-react to v1.41.0 ([46eee25](https://github.com/Muljax/id/commit/46eee25239a5296f9d96eb6280eca1155f4d401a))
* **deps:** update dependency lucide-react to v1.45.0 ([539c3f8](https://github.com/Muljax/id/commit/539c3f83a80c321aba0ef6efd3fe8e653744439d))
* **deps:** update dependency lucide-react to v1.46.0 ([89dfd15](https://github.com/Muljax/id/commit/89dfd1561c32d568506eaa9a9d4de748af4c7ea6))
* **deps:** update dependency lucide-react to v1.47.0 ([#229](https://github.com/Muljax/id/issues/229)) ([7fbb895](https://github.com/Muljax/id/commit/7fbb895cabfade2043a947ef13cfc340ea2cc87f))
* **deps:** update dependency wrangler to v4.129.0 ([98bef0d](https://github.com/Muljax/id/commit/98bef0da3b323df240fade50a20f2eee857975bd))
* **deps:** update react monorepo to v19.3.0 ([9606c72](https://github.com/Muljax/id/commit/9606c7212fc2e23fa7a3dd506698a0552d1b8f45))
* **deps:** update tanstack-router monorepo ([2947c26](https://github.com/Muljax/id/commit/2947c264eea4d11e9caef54d2667b3c5496ff209))
* **deps:** update tanstack-router monorepo ([8ed8f50](https://github.com/Muljax/id/commit/8ed8f50bf9ae3b0452098848cf62cd00687c6b0c))
* **deps:** update tanstack-router monorepo ([#219](https://github.com/Muljax/id/issues/219)) ([d0c2543](https://github.com/Muljax/id/commit/d0c254345eb3de1a200edbf0be2c3d51c37acfaf))
* **deps:** update tanstack-router monorepo ([#223](https://github.com/Muljax/id/issues/223)) ([a958a71](https://github.com/Muljax/id/commit/a958a719893786161fa2c742cef05a07d0c3b9cd))
* extract error description ([4f0812d](https://github.com/Muljax/id/commit/4f0812dc20ef96d4e547963b6671f34d8bad77cb))
* fix typo in openid config ([888be72](https://github.com/Muljax/id/commit/888be7211f077cb2fc06fdcb8bc717b6d770c668))
* guard against a workflow not corresponding to any lifecycle_actions row ([0302e2b](https://github.com/Muljax/id/commit/0302e2b0cadcd26d5691d053b37fccbaba47c41f))
* **infra:** resolve localhost truthiness bug, align wrangler configs, and wire migration variables ([2e4828e](https://github.com/Muljax/id/commit/2e4828e1dbc0e241dc1840be6fe7b6ee82415156))
* **invites:** enforce caller permission ceiling on invite token creation ([b1a6999](https://github.com/Muljax/id/commit/b1a6999ed46476ede79ef985c1d7beb828e58a0c))
* **lifecycle:** revoke active ssh certificates upon user deactivation ([48061c3](https://github.com/Muljax/id/commit/48061c323e6cd8d8f1db8e49cc192f537f22028b))
* limit passwords to 128 characters to prevent CPU exhaustion DoS ([#178](https://github.com/Muljax/id/issues/178)) ([ea32aa1](https://github.com/Muljax/id/commit/ea32aa117a008e88b18423fb4b0e585dbcaee3cc))
* normalize resource names from the instance name var ([#215](https://github.com/Muljax/id/issues/215)) ([7e8d4e7](https://github.com/Muljax/id/commit/7e8d4e76ad9b83eb60fa71ea426d77afdbb5f620))
* **oauth:** enable public cors, persist consent grants, and secure authorization redirects ([dacc6d7](https://github.com/Muljax/id/commit/dacc6d7fd91f213c67da33edd2db1aac49b64b41))
* **oauth:** enforce atomic token exchanges, token reuse detection, and public client pkce ([38b0e3d](https://github.com/Muljax/id/commit/38b0e3d926f0eb89b1d507a5b1d2474ee5f525b8))
* **oauth:** redirect authorization errors to valid redirect_uri per rfc6749 ([908fd75](https://github.com/Muljax/id/commit/908fd75ccba2844409726b88c4cc2b37e4103c08))
* **oauth:** respect sign in policy ([efc9c67](https://github.com/Muljax/id/commit/efc9c67d6e33c573258d77651f6c6fc5947c8279))
* **oauth:** revoke access tokens when authorization codes are reused ([ab310ba](https://github.com/Muljax/id/commit/ab310ba18e5149ad81f7137a87828703ad867f66))
* **oauth:** revoke refresh tokens on code reuse and gate id_token on openid scope ([04d3a72](https://github.com/Muljax/id/commit/04d3a72254c657493e954bb53ee3f04e0d4df5e3))
* **oidc:** add revocation and introspection endpoints to openid discovery ([7947a41](https://github.com/Muljax/id/commit/7947a41ddfe61d84c88730bc14ba2244a277056b))
* **oidc:** enforce openid scope requirement on userinfo endpoint ([5bd5da9](https://github.com/Muljax/id/commit/5bd5da9e582255ab0d8531085d131556e86f1548))
* **oidc:** return consent_required on prompt=none when consent is missing ([85ca299](https://github.com/Muljax/id/commit/85ca29973fad7b0a2f6855b7f37ac779f4dd9a6b))
* poll http notifications endpoint ([#191](https://github.com/Muljax/id/issues/191)) ([cf6d3ca](https://github.com/Muljax/id/commit/cf6d3ca91eb628b8ebe5f8c45c032d3bc12dc36d))
* provide authorization code ID ([f2ee8c3](https://github.com/Muljax/id/commit/f2ee8c37cbf8e837cc17c5be9d313c1f8bb28f5d))
* provide storedToken.id to createAccessToken ([c1866a4](https://github.com/Muljax/id/commit/c1866a414f6525ce633815b854e37f013e9c8df4))
* **rbac:** enforce permission ceiling on role assignment and role modification ([321ef98](https://github.com/Muljax/id/commit/321ef98dfd00b1de324bb5edb7c9f838e54ae435))
* **rbac:** reference SYSTEM_ROLE_IDS.ADMIN constant consistently ([0042f2a](https://github.com/Muljax/id/commit/0042f2a2be04cacf36aa1b98d266cb931debc750))
* **rbac:** support multi-level hierarchical wildcards in permission matcher ([6ac2a06](https://github.com/Muljax/id/commit/6ac2a06fd1e1dde360ee04a70fedeae0e2c83edd))
* reconcile database row if workflow creation fails ([741dee3](https://github.com/Muljax/id/commit/741dee3be3635ba0d1a80e8c02521a3a8e13668a))
* remove assets binding in docs ([f065343](https://github.com/Muljax/id/commit/f0653431fd6d21c7154d1203442f0cfbcb76df32))
* return 409 on username collision ([1121d64](https://github.com/Muljax/id/commit/1121d64d5d3b60537827e11add327f1757214731))
* return proper error if response code is missing ([32b02d5](https://github.com/Muljax/id/commit/32b02d565fb85edab30886f8f44ba3c325d64ff7))
* **security:** constant-time equality, user enumeration mitigation, and atomic passkeys ([5ce97e2](https://github.com/Muljax/id/commit/5ce97e2dd6e476a7dcd801c31b84be0533e2b04c))
* seperate execution failure from completion persistence ([7115334](https://github.com/Muljax/id/commit/7115334c54684bc445d87a3e60886850803a325c))
* some cleanup ([#181](https://github.com/Muljax/id/issues/181)) ([026cc91](https://github.com/Muljax/id/commit/026cc91edd1781cde58bf133a21dce6d11f13194))
* **ssh:** sort critical options lexicographically and wrap inner option strings ([d907376](https://github.com/Muljax/id/commit/d907376297ced442e1e0283ea4a1017e071f450d))
* use react FormEvent type ([5037984](https://github.com/Muljax/id/commit/503798434b1c0ea09e1aaf326ead5641d70ad48e))
* validate body properly ([5c36a62](https://github.com/Muljax/id/commit/5c36a62db1be2411a726e23a5d1b4ac4feb3f627))
* validate emails during signup ([#180](https://github.com/Muljax/id/issues/180)) ([65589a0](https://github.com/Muljax/id/commit/65589a0e73889199ad0eb2db371e54e2475b8321))
* you can pass forceDestroy to the R2 stack to empty the bucket ([71df8b6](https://github.com/Muljax/id/commit/71df8b685aed33ca120a401b5cab84c72a38b6df))


### Performance Improvements

* background expired session deletion ([#208](https://github.com/Muljax/id/issues/208)) ([93b4e2c](https://github.com/Muljax/id/commit/93b4e2c81131198dd727d52d90a51a70d1895649))
* set argon2id memory alloc to 19mb ([#210](https://github.com/Muljax/id/issues/210)) ([dd5794c](https://github.com/Muljax/id/commit/dd5794c6ebede41345c824eb254e495083754c2a))
* use javascript native toHex ([#211](https://github.com/Muljax/id/issues/211)) ([a773099](https://github.com/Muljax/id/commit/a7730991634c395bbbbbe119ad18719682ddf72d))
* use native base64 and timingSafeEqual methods ([#212](https://github.com/Muljax/id/issues/212)) ([2837f8a](https://github.com/Muljax/id/commit/2837f8a85ee75625ff4681cc7d22c0a9571c9824))

## [1.1.0](https://github.com/Muljax/id/compare/v1.0.0...v1.1.0) (2026-09-19)


### Features

* **ssh:** add cleanup job that removes expired certificates whether or not they are revoked ([c97a509](https://github.com/Muljax/id/commit/c97a509edd9b44ef8a15ca6a34dfe763a2d2cc76))

## [1.0.0](https://github.com/Muljax/id/compare/v0.33.2...v1.0.0) (2026-09-19)


### ⚠ BREAKING CHANGES

* release 1.0.0 and update core repository documentation

### Features

* release 1.0.0 and update core repository documentation ([b7781a1](https://github.com/Muljax/id/commit/b7781a16222c57ec3b1ca8c020b4207ddf767e98))


### Bug Fixes

* **auth:** make password reset token consumption atomic to prevent replay and race conditions ([86ab445](https://github.com/Muljax/id/commit/86ab445cfcc6b4b3cb06b0a7b59936c5ec8dc9fd))
* **auth:** prevent race conditions in single-use invite token registration ([42d69b2](https://github.com/Muljax/id/commit/42d69b28e8d0b2aea45fed498adde816a50ba28f))
* **auth:** tighten cookie sameSite to Lax and add origin validation on oauth consent ([daf2d74](https://github.com/Muljax/id/commit/daf2d74fa3e43fb7277bb1007b7932cf86317ab1))
* **invites:** enforce caller permission ceiling on invite token creation ([b1a6999](https://github.com/Muljax/id/commit/b1a6999ed46476ede79ef985c1d7beb828e58a0c))
* **lifecycle:** revoke active ssh certificates upon user deactivation ([48061c3](https://github.com/Muljax/id/commit/48061c323e6cd8d8f1db8e49cc192f537f22028b))
* **oauth:** redirect authorization errors to valid redirect_uri per rfc6749 ([908fd75](https://github.com/Muljax/id/commit/908fd75ccba2844409726b88c4cc2b37e4103c08))
* **oauth:** revoke refresh tokens on code reuse and gate id_token on openid scope ([04d3a72](https://github.com/Muljax/id/commit/04d3a72254c657493e954bb53ee3f04e0d4df5e3))
* **oidc:** add revocation and introspection endpoints to openid discovery ([7947a41](https://github.com/Muljax/id/commit/7947a41ddfe61d84c88730bc14ba2244a277056b))
* **oidc:** enforce openid scope requirement on userinfo endpoint ([5bd5da9](https://github.com/Muljax/id/commit/5bd5da9e582255ab0d8531085d131556e86f1548))
* **oidc:** return consent_required on prompt=none when consent is missing ([85ca299](https://github.com/Muljax/id/commit/85ca29973fad7b0a2f6855b7f37ac779f4dd9a6b))
* **rbac:** enforce permission ceiling on role assignment and role modification ([321ef98](https://github.com/Muljax/id/commit/321ef98dfd00b1de324bb5edb7c9f838e54ae435))
* **rbac:** reference SYSTEM_ROLE_IDS.ADMIN constant consistently ([0042f2a](https://github.com/Muljax/id/commit/0042f2a2be04cacf36aa1b98d266cb931debc750))
* **rbac:** support multi-level hierarchical wildcards in permission matcher ([6ac2a06](https://github.com/Muljax/id/commit/6ac2a06fd1e1dde360ee04a70fedeae0e2c83edd))
* **ssh:** sort critical options lexicographically and wrap inner option strings ([d907376](https://github.com/Muljax/id/commit/d907376297ced442e1e0283ea4a1017e071f450d))

## [0.33.2](https://github.com/Muljax/id/compare/v0.33.1...v0.33.2) (2026-09-19)


### Bug Fixes

* extract error description ([4f0812d](https://github.com/Muljax/id/commit/4f0812dc20ef96d4e547963b6671f34d8bad77cb))

## [0.33.1](https://github.com/Muljax/id/compare/v0.33.0...v0.33.1) (2026-09-19)


### Bug Fixes

* **oauth:** respect sign in policy ([efc9c67](https://github.com/Muljax/id/commit/efc9c67d6e33c573258d77651f6c6fc5947c8279))

## [0.33.0](https://github.com/Muljax/id/compare/v0.32.1...v0.33.0) (2026-09-19)


### Features

* **auth,admin:** add instance access policies, invite tokens, and break-glass sign-in keys ([e4efc87](https://github.com/Muljax/id/commit/e4efc87373c7af3331fc91b83dcd3d1349dc25cb))

## [0.32.1](https://github.com/Muljax/id/compare/v0.32.0...v0.32.1) (2026-09-18)


### Bug Fixes

* add the UI for selecting and adding custom scopes to clients ([#236](https://github.com/Muljax/id/issues/236)) ([50812af](https://github.com/Muljax/id/commit/50812af626c538206eb99555a92b66297c299c51))
* **auth:** restrict OAuth tokens to granted scopes and guard account mutations ([#233](https://github.com/Muljax/id/issues/233)) ([feec962](https://github.com/Muljax/id/commit/feec962de4dfa3a8ef590718d5dadd081b57d01a))

## [0.32.0](https://github.com/Muljax/id/compare/v0.31.0...v0.32.0) (2026-09-18)


### Features

* seeding docs, seed cli client, allow loopback redirect URIs on any port ([a77f92d](https://github.com/Muljax/id/commit/a77f92de3b797a857cd77f9dbf990888a18f4a56))

## [0.31.0](https://github.com/Muljax/id/compare/v0.30.0...v0.31.0) (2026-09-17)


### Features

* add krl binary format ([f615e9f](https://github.com/Muljax/id/commit/f615e9f93e54598a8e0e57132438bc2739e42a9c))

## [0.30.0](https://github.com/Muljax/id/compare/v0.29.0...v0.30.0) (2026-09-17)


### Features

* docs, ssh ca admin ui update ([2103173](https://github.com/Muljax/id/commit/2103173d7fdca31841fad37d7f0b0bb51d5469d2))


### Bug Fixes

* **deps:** update dependency lucide-react to v1.47.0 ([#229](https://github.com/Muljax/id/issues/229)) ([7fbb895](https://github.com/Muljax/id/commit/7fbb895cabfade2043a947ef13cfc340ea2cc87f))
* remove assets binding in docs ([f065343](https://github.com/Muljax/id/commit/f0653431fd6d21c7154d1203442f0cfbcb76df32))

## [0.29.0](https://github.com/Muljax/id/compare/v0.28.0...v0.29.0) (2026-09-17)


### Features

* ssh ca ([e5fbb4a](https://github.com/Muljax/id/commit/e5fbb4a98ad12e2dd18b7d9b1d5be787f42cabae))

## [0.28.0](https://github.com/Muljax/id/compare/v0.27.0...v0.28.0) (2026-09-17)


### Features

* dashboard respects rbac ([d39ff97](https://github.com/Muljax/id/commit/d39ff976c692e99fe2e5d183c42566dde6a73dd5))
* **rbac:** enforce permission dependencies and role cache invalidation ([8a1b349](https://github.com/Muljax/id/commit/8a1b3490fa78ddfd9cc057592537deb0b9e2af40))


### Bug Fixes

* **deps:** update tanstack-router monorepo ([#223](https://github.com/Muljax/id/issues/223)) ([a958a71](https://github.com/Muljax/id/commit/a958a719893786161fa2c742cef05a07d0c3b9cd))

## [0.27.0](https://github.com/Muljax/id/compare/v0.26.3...v0.27.0) (2026-09-16)


### Features

* rbac ([#221](https://github.com/Muljax/id/issues/221)) ([58d517a](https://github.com/Muljax/id/commit/58d517a2793e6049967805809998dc5bd77870ec))


### Bug Fixes

* **deps:** update tanstack-router monorepo ([#219](https://github.com/Muljax/id/issues/219)) ([d0c2543](https://github.com/Muljax/id/commit/d0c254345eb3de1a200edbf0be2c3d51c37acfaf))

## [0.26.3](https://github.com/Muljax/id/compare/v0.26.2...v0.26.3) (2026-09-16)


### Bug Fixes

* **crypto:** resolve illegal invocation in timingSafeEqual ([#216](https://github.com/Muljax/id/issues/216)) ([36de80a](https://github.com/Muljax/id/commit/36de80a719ca9f67f369259806f4ab35043235d5))
* normalize resource names from the instance name var ([#215](https://github.com/Muljax/id/issues/215)) ([7e8d4e7](https://github.com/Muljax/id/commit/7e8d4e76ad9b83eb60fa71ea426d77afdbb5f620))

## [0.26.2](https://github.com/Muljax/id/compare/v0.26.1...v0.26.2) (2026-09-16)


### Bug Fixes

* **auth:** resolve double sign-in and cookie session persistence ([#213](https://github.com/Muljax/id/issues/213)) ([cfcfc8f](https://github.com/Muljax/id/commit/cfcfc8ff6309bd9cccf8c1ced26a19cd772f7169))

## [0.26.1](https://github.com/Muljax/id/compare/v0.26.0...v0.26.1) (2026-09-16)


### Performance Improvements

* background expired session deletion ([#208](https://github.com/Muljax/id/issues/208)) ([93b4e2c](https://github.com/Muljax/id/commit/93b4e2c81131198dd727d52d90a51a70d1895649))
* set argon2id memory alloc to 19mb ([#210](https://github.com/Muljax/id/issues/210)) ([dd5794c](https://github.com/Muljax/id/commit/dd5794c6ebede41345c824eb254e495083754c2a))
* use javascript native toHex ([#211](https://github.com/Muljax/id/issues/211)) ([a773099](https://github.com/Muljax/id/commit/a7730991634c395bbbbbe119ad18719682ddf72d))
* use native base64 and timingSafeEqual methods ([#212](https://github.com/Muljax/id/issues/212)) ([2837f8a](https://github.com/Muljax/id/commit/2837f8a85ee75625ff4681cc7d22c0a9571c9824))

## [0.26.0](https://github.com/Muljax/id/compare/v0.25.0...v0.26.0) (2026-09-16)


### Features

* **dashboard:** adopt @tanstack/react-query for state management and caching ([#205](https://github.com/Muljax/id/issues/205)) ([02a597c](https://github.com/Muljax/id/commit/02a597c14254b321ce71f972b4b8c0535fc7f006))

## [0.25.0](https://github.com/Muljax/id/compare/v0.24.0...v0.25.0) (2026-09-16)


### Features

* **dashboard:** adopt @tanstack/react-form across all dashboard views ([#203](https://github.com/Muljax/id/issues/203)) ([27bfe44](https://github.com/Muljax/id/commit/27bfe44f41d6309168e193f58d6426783fc44f50))

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
