# Code review: CLI surface layer (`cs`)

- Phạm vi: `src/cli.ts`, `src/core/**`, `src/commands/{alias,remove,use,current,reset,env}/**`; đối chiếu `.harness/docs/code-standards.md`.
- Kiểm chứng: đã đọc từng dòng bị nêu, đối chiếu source commander 15.0.0 và @clack/core 1.5.1 trong `node_modules`, chạy `pnpm test` (220 passed), `pnpm lint` (clean), `pnpm typecheck` (clean). Không chạy dist CLI.
- Findings xếp theo mức độ nghiêm trọng.

---

## High

### H1. `cs config --help` in token (token) của profile default ra stdout không che

- File: `src/cli.ts:105-119` (renderer) + `src/commands/config/config.command.ts:33` (gắn `csLiveDefault: 'token'`); nguồn giá trị: `src/modules/profiles/services/storage.service.ts:29-39` (`readLiveDefault` trả về giá trị thô, không che).
- Lỗi: `optionDescription` ghép `default: "<giá trị thô>"` vào mô tả option `--token` mà không qua `maskToken`.
- Kịch bản: sau khi user chạy `cs config -t <key>` (profile default có token), bất kỳ lần `cs config --help` nào cũng in `API token (default: "sk-...")` nguyên văn ra stdout. Help thường được dán vào issue/CI log → lộ credential (bí mật).
- Vì CI vẫn xanh: `tests/config.command.test.ts:51` chỉ assert `not.toContain('API token (default')` trên trạng thái token rỗng (`OFFICIAL_PROFILE.token` là chuỗi rỗng, `src/modules/profiles/constants/profile.constant.ts:16`). Trạng thái "default profile có token" không được test.
- Sửa đề xuất: trong `optionDescription` của `cli.ts`, che các field nhạy cảm (`token`, `oauthToken`) qua `maskToken` trước khi render; hoặc không gắn live default cho `--token`.

## Medium

### M1. `maskToken` lộ trọn token ngắn (9-12 ký tự), mâu thuẫn với comment của chính nó

- File: `src/core/utils/mask-token.util.ts:7-11`; nơi tiêu thụ: `src/core/ui/profile.ui.ts:17-18` (đầu ra của `cs use`, `cs current`, `cs config`).
- Lỗi: nhánh `length > 8` hiển thị `slice(0, 8)` + `slice(-4)`; với token dài 9-12, hai miền này phủ kín token. Đã chạy thử: len 9 → `abcdefgh...fghi` (9/9 ký tự), len 12 → đủ cả token. Comment dòng 1 khẳng định "A secret never reaches the terminal in full".
- Kịch bản: token do user tự đặt (self-hosted gateway, key ngắn) bị lộ trọn vẹn trong output `cs use`, trong khi tool tin là đã che.
- Sửa đề xuất: chỉ hiện hai đầu khi `length >= 16`; dưới ngưỡng đó in `****`.

### M2. Help/version exit qua `process.exit` của commander → output pipe bị cắt cụt

- File: `src/cli.ts:174-181` (nhánh `argv.length <= 2` gọi `program.help()`); commander 15: `lib/command.js:2635-2650` (`help()` → `this._exit(exitCode, 'commander.help', ...)`) → `:534-540` (`process.exit(exitCode)`).
- Lỗi: ở run thật (`exitOverride = false`, chỉ test mới bật — `cli.ts:48-54`), `program.help()` và đường `--version` kết thúc bằng `process.exit(0)` ngay sau khi write vào stdout. Với stdout là pipe (`cs | head`, `cs > log.txt`), write là async nên phần cuối banner/help có thể bị mất.
- Kịch bản: `cs | head -40` trong script → vài dòng cuối của help bị cắt âm thầm.
- Sửa đề xuất: dùng `exitOverride()` + tự set `process.exitCode` và return (code đã có nhánh bắt `CommanderError` sẵn ở `cli.ts:186-190`), hoặc flush trước khi thoát.

### M3. `cli.ts` không đăng ký global handler nào → crash ra ngoài `parseAsync` vi phạm hợp đồng crash

- File: `src/cli.ts` toàn file; grep toàn `src/`: chỉ có 3 phép gán `process.exitCode` (:165, :187, :194), không có `process.on`.
- Lỗi: chuẩn (`code-standards.md` mục CLI và Exit codes) giao "the global handlers" cho `cli.ts` và hứa "crash ... stays a bare line on stderr, with the stack under `CS_DEBUG=1`". Thực tế không có `uncaughtException`, `unhandledRejection`, hay listener `'error'` cho stdout/stderr. Đơn cử: `cs list | head -1` → EPIPE phát sự kiện `'error'` trên `process.stdout` không có listener → uncaught exception → Node in nguyên stack ra stderr bất kể `CS_DEBUG`, và mọi lỗi ngoài chuỗi await của `parseAsync` không bao giờ đi qua `reportFatalError` (`cli.ts:156-166`).
- Sửa đề xuất: đăng ký `process.on('uncaughtException'/'unhandledRejection')` và listener EPIPE trong `cli.ts`, routing vào `reportFatalError`.

### M4. `cs env` chạy prompt (prompt) mà không có guard (bảo vệ) non-interactive

- File: `src/commands/env/env.command.ts:24-36, :55-63, :74-92, :109-118, :135`.
- Lỗi: `select`/`autocomplete`/`text` được gọi không kiểm tra stdin/stdout. Với stdin EOF (`cs env < /dev/null`, CI), readline của @clack/core (`terminal: true`) không nhận keypress nào → promise (lời hứa) của prompt không bao giờ settle → tiến trình thoát âm thầm với code 0 mà không làm gì, hoặc treo vĩnh viễn nếu stdin là pipe còn mở.
- Điểm nghịch: `isInteractive()` (`src/core/ui/terminal.ui.ts:13-21`) đã được viết chuẩn xác cho mục đích này nhưng chỉ được dùng cho banner (`cli.ts:137`).
- Kèm hai ghi chú cùng luồng: (a) Ctrl-C trong prompt → `block()` của @clack/core gọi thẳng `process.exit(0)` (dist `:150`) → `cs env` hủy vẫn exit 0, script không phân biệt được với thành công; (b) luồng prompt tương tác có 0 coverage (độ phủ kiểm thử) — `tests/env.command.test.ts` chỉ gọi `applyEnvChange` trực tiếp, không hề chạy qua prompt.
- Sửa đề xuất: guard `isInteractive()` đầu action, non-interactive thì throw `CliError` với hướng dẫn dùng `cs config` thay thế.

## Low

### L1. Guard (bảo vệ) trùng lặp, dead code (mã chết)

- File: `src/commands/env/env.command.ts:120-130` — hai khối `if (!isText(key))` giống hệt nhau nối tiếp; khối thứ hai không bao giờ chạy.

### L2. Đường launcher (trình khởi chạy) được tính lại thay vì dùng giá trị đã trả về

- File: `src/commands/alias/alias.command.ts:29` (`binHomePath()/buildLauncherName(...)`) vs `src/commands/alias/services/alias.service.ts:71-78` (`launcherPath` được trả về nhưng không dùng). Hai đường code cho một path hiển thị; lệch nhau khi naming đổi.

### L3. Chuỗi ghi file không atomic (nguyên tử) — mỗi cửa sổ hẹp, single-process, chạy lại là phục hồi

- `src/commands/alias/services/alias.service.ts:64` lưu `cs.json` trước khi render launcher `:71` — lỗi giữa chừng để lại alias trong config mà không có launcher; lần chạy sau báo "re-pointed".
- `src/commands/remove/services/remove.service.ts:53-59` xóa launcher trước `saveCsConfig` — save lỗi thì config còn alias treo.
- `src/commands/use/services/use.service.ts:46-50` render artifact (tạo tác) trước `writeProfileGlobally` — lỗi thì `currentProfile` cũ.

### L4. Check (kiểm tra) phòng thủ không bao giờ kích hoạt

- File: `src/commands/reset/services/reset.service.ts:43-47` — sau `resetProfiles`, profile default luôn tồn tại (`src/modules/profiles/services/storage.service.ts:231` gán lại `{ default: ... }`), nên nhánh throw là dead code.

## Informational

- Lệnh đọc có side effect (tác dụng phụ) ghi đĩa: `runCurrent` → `loadCsConfig` tạo `cs.json` khi thiếu, hoặc đổi tên file không parse được thành `.corrupt` (`src/modules/profiles/services/storage.service.ts:107-139`). Có notice (thông báo) rõ, nhưng `cs current` trên máy mới không phải read-only (chỉ đọc).

---

## Điểm đã xác minh là đúng (để tránh báo cáo giả)

- Comment "A subcommand copies this setting when it is created" (`cli.ts:51`, `:71`): chính xác — commander `copyInheritedSettings` (`lib/command.js:96-113`) kế thừa `allowExcessArguments`, help/output config, `_exitCallback` (exitOverride), `showHelpAfterError`.
- Contract `options` dạng function của `autocomplete`: `setKeyOptionsGetter` với `this.userInput` khớp @clack/core (`get options() { return typeof #i === 'function' ? #i() : #i }` — gọi với `this` là prompt, có getter `userInput`).
- Nhánh hủy prompt: `isText` xử lý đúng `CANCEL_SYMBOL`; mọi `CliError` đi qua `renderError` + `exitCode` đúng (`cli.ts:192-196`); `CommanderError` giữ nguyên exit code commander chọn (`:186-190`).
- Không có service nào in ra stdout/stderr; không có `process.exit` ngoài `cli.ts`; masking discipline (nguyên tắc che giấu) đúng ở `profile.ui.ts`; lookup chống prototype pollution đúng (`Object.hasOwn` trong `storage.service.ts`).

## Metrics (chỉ số)

- Test: 220/220 passed (19 files); `pnpm lint` clean; `pnpm typecheck` clean.
- Linting issues: 0. Test coverage: không đo được số %; `cs env` prompt flow và nhánh live-default-token có token thật = 0 coverage.

## Hành động đề xuất (theo thứ tự ưu tiên)

1. Sửa H1: che token trong `optionDescription` (một dòng guard trong `cli.ts`) + thêm test với default profile có token.
2. Sửa M1: ngưỡng `maskToken` theo độ dài tối thiểu + test bảng (table test) cho len 9-12.
3. Thêm global handler + EPIPE guard trong `cli.ts` (M3), cân nhắc `exitOverride` cho help/version (M2).
4. Guard non-interactive cho `cs env` (M4), dọn L1-L2.

## Unresolved questions (câu hỏi chưa giải quyết)

- Việc `cs env` hủy (Ctrl-C) exit 0 là hành vi mặc định của @clack (upstream) — có muốn chuẩn hóa exit code hủy (vd 130) cho `cs` không? Đây là lựa chọn policy (chính sách), cần quyết định ghi nhận.
