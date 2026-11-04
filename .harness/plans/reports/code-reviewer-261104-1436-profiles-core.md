# Code review — profiles domain core (security-sensitive)

- Scope: `src/modules/profiles/**` (services, checks, types, constants), `src/commands/config/**`, đối chiếu `use`/`remove`/`alias` vì cùng chạm filesystem.
- Phạm vi đọc: 22 file trong scope + 5 file ngoài scope để truy vết caller. Đã chạy `pnpm lint` (sạch) và `pnpm test` (220/220 pass).
- Read-only; không chạy CLI build, không đụng môi trường thật.

## Overall Assessment

Kiến trúc nền tốt: tên profile được validate chặt (charset `[a-zA-Z0-9_-]+`, chặn separator/traversal/unicode/control char), `Object.hasOwn` + `Object.defineProperty` chống profile tên `toString`/`__proto__` (có test), launcher không chứa secret, mode 0600 được `chmod` ép lại sau mỗi lần ghi (có test), artifact cleanup có guard `isValidProfileName`. Các lỗi bên dưới là thật, đã đối chiếu từng dòng.

## Critical

### C1. Token API bị in nguyên văn vào `cs config --help`
- `src/commands/config/config.command.ts:33` — `liveOption('--token, -t <token>', 'API token', 'token')`
- `src/cli.ts:105-116` — `optionDescription` gọi `readLiveDefault(csLiveDefault)` rồi `JSON.stringify(liveDefault)` push vào `default: ...`
- `src/modules/profiles/services/storage.service.ts:29-39` — `readLiveDefault('token')` trả về token thô của profile `default`.
- Kịch bản: người dùng chạy `cs config --help` (hoặc `cs help config`) → token của profile `default` (`sk-ant-...`) in đầy đủ ra terminal. Vi phạm trực tiếp contract "secrets: never printed unmasked"; help output hay bị dán vào issue/screenshot/CI log. `maskToken` (`src/core/utils/mask-token.util.ts`) tồn tại nhưng không được dùng ở đường này. Không có test nào chặn leak này.
- Fix đề xuất: loại `'token'` khỏi tập trường live-default (chỉ giữ `url` và model IDs), hoặc mask trước khi render. Thêm test assert help output không chứa token.

## High

### H1. Ghi file không atomic + không có lock → partial write và lost update
- `src/modules/profiles/services/storage.service.ts:57-62` (`writeJsonFile`), `src/modules/profiles/services/claude-settings.service.ts:27-33`, `src/modules/profiles/services/render-artifacts.service.ts:31-33`, `src/modules/profiles/services/alias-launcher.service.ts:12-15` — tất cả đều `writeFile` đè trực tiếp lên file cũ, không temp+rename, không lock.
- Kịch bản 1 (crash/power loss giữa chừng): cs.json bị truncate → lần chạy sau `loadCsConfig` chuyển nó sang `.corrupt` và reset về default (dữ liệu còn cứu được, đúng contract); nhưng artifact `~/.config/cs/profiles/<name>.json` và `settings.json` bị truncate thì **không** có cơ chế recovery nào — launcher `claude --settings` sẽ chạy vào file hỏng một cách im lặng.
- Kịch bản 2 (TOCTOU read-modify-write): hai tiến trình `cs` chạysong song (`cs config -n a -t ...` và `cs config -n b ...`) cùng `loadCsConfig` → cùng snapshot → ai save sau thắng, profile của tiến trình kia mất rất im lặng (không `.corrupt`, không notice).
- Fix đề xuất: ghi ra `<path>.tmp` cùng thư mục rồi `rename` (atomic trên cùng filesystem); cân nhắc lockfile cho cs.json. Ít nhất áp dụng cho cs.json và artifact vì cả hai chứa secret.

## Medium

### M1. save trước render → artifact stale giữ token cũ khi render lỗi
- `src/commands/config/services/config.service.ts:180-182` — `saveCsConfig(config)` rồi mới `renderProfileArtifacts(...)`. Nếu render throw (disk full, permission), cs.json đã cập nhật token mới nhưng artifact trên đĩa vẫn là token cũ, launcher vẫn trỏ vào nó → `claude-<name>` chạy tiếp với credential cũ mà không có cảnh báo nào. Tương tự `src/commands/remove/services/remove.service.ts:58-59`: `saveCsConfig` trước `removeProfileArtifacts` — crash giữa hai bước để lại artifact mồ côi chứa token của profile đã xóa. Ngược lại `remove.service.ts:53-56` xóa launcher trước khi save — crash để lại alias trong map mà launcher đã mất.
- Fix đề xuất: render/ghi artifact thành công rồi mới commit cs.json (order mà `use.service.ts:46-48` đã làm đúng), và xóa artifact trước khi save khi remove.

### M2. `detectActiveProfile` không bao giờ khớp profile chỉ có oauthToken
- `src/modules/profiles/services/active-profile.service.ts:16-20` — gate `if (!url) return null;`. Profile oauth-only có `url: ''` (auth-modes.md dòng 15: oauth không cần url), nên fallback-detect (chỉ dùng khi `currentProfile` thiếu, dòng 41-56) trả `null` dù `CLAUDE_CODE_OAUTH_TOKEN` khớp exactly. `cs current` sẽ báo "no active profile" cho chính profile đang bật.
- Fix đề xuất: khi url thiếu/empty, so khớp thêm `CLAUDE_CODE_OAUTH_TOKEN`.

## Low

### L1. `rename` đè lên `cs.json.corrupt` cũ
- `src/modules/profiles/services/storage.service.ts:101-105` — `rename` POSIX ghi đè đích. Nếu đã có `.corrupt` từ lần trước (người dùng đang chờ convert tay theo decision 0012), file đó — có thể chứa credential khác — bị xóa im lặng. Đề xuất: nếu `.corrupt` tồn tại, đổi tên có timestamp hoặc throw với hint.

### L2. Cửa sổ mode + symlink khi ghi secret
- `storage.service.ts:59-61`, `claude-settings.service.ts:31-32`, `render-artifacts.service.ts:32-33` — `writeFile` giữ mode cũ của file đã tồn tại; secret được ghi vào file 0644 trước khi `chmod 0600` chạy xong (cửa sổ nhỏ nhưng thật). `writeFile`/`chmod` theo symlink: một symlink tại `cs.json` hay `profiles/<name>.json` khiến cs ghi xuyên qua và chmod cả đích. `mkdir` mặc định (không mode 0700) để `~/.config/cs/profiles` listable — lộ tên profile, không lộ secret. Trong threat model single-user đây là Low; đóng cửa sổ bằng `open`+`fchmod` hoặc ghi temp+rename (H1) sẽ xử lý luôn.

### L3. Login mode render ra key env rỗng, lệch ma trận trong auth-modes.md
- `src/modules/profiles/services/render.service.ts:67-77` — luôn emit `ANTHROPIC_AUTH_TOKEN: ''` và `ANTHROPIC_BASE_URL: ''` kể cả khi profile rỗng, trong khi auth-modes.md mô tả login mode là "no credentials". `writeProfileGlobally` đè nguyên block env của settings.json bằng block này. Doc đã ghi chú hành vi runtime do user tự verify — nêu ở đây để có ý thức, không bắt buộc sửa.

## Informational

- `config.service.ts:154-163` — nhánh "show tạo mới" gọi `renderProfileArtifacts` thật nhưng trả `artifacts: null` và bỏ qua `ensureBinPath`: launcher đã được tạo nhưng output không nói cho user biết.
- `claude-settings.service.ts:21-24` — `JSON.parse` trả scalar (vd. `"x"`) được spread thành indexed props rồi ghi đè lại thành object; không crash nhưng thay thế file người dùng một cách kỳ lạ. Hand-edited input, chấp nhận được theo triết lý "tolerant renderer".
- `profile-name.check.ts:17` — check `includes('..')` và separator là dư thừa khi `NAME_PATTERN` đã chặn; giữ lại làm lỗi MESSAGE rõ hơn là hợp lý, không phải bug.

## Edge cases đã kiểm (không phải finding)

- Profile tên `toString`/`constructor`: được lưu qua `defineProperty` và tra cứu qua `hasOwn` (`storage.service.ts:154-166`), có test tại `tests/profiles-storage.service.test.ts:224,349`. JSON.parse tạo own-property cho `__proto__` nên không dính setter.
- Unicode/control char/`..`/`/` trong tên: bị `NAME_PATTERN` chặn ở mọi entry point (`config`, `use`, `remove`, `alias` — đã grep xác nhận 4 caller đều validate).
- Launcher content (`launcher.service.ts:9-11`): tên đã qua validate charset nên không inject được vào dòng `sh`; không chứa secret.
- Mode 0600: được ép bằng `chmod` sau mỗi lần ghi, có test (`tests/profiles-storage.service.test.ts:41-46`).

## Metrics

- Lint: 0 lỗi. Tests: 220/220 pass (bundle build OK). Type coverage: strict + noUncheckedIndexedAccess bật, `tsc` trong `pnpm test` pass.
- Coverage gap đáng chú ý: không có test assert help output không chứa secret (C1), không test crash-mid-write hay chạy song song (H1).

## Recommended Actions

1. C1: bỏ `'token'` khỏi live-default (hoặc mask) + thêm test — nhỏ, sửa ngay.
2. H1: chuyển sang ghi temp + `rename` cho cs.json/settings.json/artifact.
3. M1: đổi order commit (artifact xong rồi mới save cs.json; remove: xóa artifact trước save).
4. M2: mở rộng `detectActiveProfile` cho oauth-only profile.

## Unresolved Questions

- L3: Claude Code có coi key env rỗng (`ANTHROPIC_AUTH_TOKEN: ''`) là "unset" hay là "đặt token rỗng"? Theo doc, việc verify runtime là của user — cần xác nhận một lần rồi cập nhật auth-modes.md.
