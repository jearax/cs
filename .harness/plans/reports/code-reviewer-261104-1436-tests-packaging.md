# Code review: test suite, build/packaging, install script

- Ngày: 2026-11-04 | Reviewer: code-reviewer | Read-only
- Scope: `tests/**`, `package.json`, `tsdown.config.ts`, `vitest.config.ts`, `eslint.config.mjs`, `pnpm-workspace.yaml`, `.husky/*`, `scripts/install.sh`, `scripts/package-info.mjs`
- Đã chạy: `pnpm test` (19 files, 220 tests pass, ~0.8s), `pnpm lint` (0 lỗi), `pnpm typecheck` (0 lỗi). Không chạy `install.sh` hay built CLI với môi trường thật.

## Overall Assessment

Suite có chất lượng cao: 220 test chạy trong <1s, `useTempHome()` cô lập mọi write vào temp HOME, không tìm thấy assertion rỗng (mọi test đều khẳng định nội dung stdout/stderr + exit code). Kiến trúc test architecture-rules với negative fixture cho từng rule + positive control qua real-src scan là thiết kế tốt. Các finding nghiêm trọng nằm ở: (1) không có CI nào, (2) một đường data-loss chưa có test bảo vệ, (3) bug PATH-relative trong install.sh.

## Critical

### C1. Không có CI; gates chỉ chạy local và không bao gồm test
- `.github/` không tồn tại — không workflow nào. Gate duy nhất: `.husky/pre-commit` chỉ chạy `lint-staged` (eslint --fix + prettier), `.husky/commit-msg` chỉ chạy commitlint.
- Hệ quả: `pnpm test`, `pnpm typecheck`, `pnpm build` không bao giờ được enforcement tự động; một commit lên `main` (hoặc một clone cài qua install.sh) có thể breaks toàn bộ test suite mà không ai thấy. install.sh nhân bản repo ở HEAD của default branch, nên một regression test-fit chỉ bị phát hiện sau khi user đã cài.
- Fix đề xuất: thêm GitHub Actions chạy `pnpm lint && pnpm typecheck && pnpm test` trên node >=24.11 (macOS + ubuntu).

### C2. Corrupt `~/.claude/settings.json` bị ghi đè câm lặng — data loss không có test
- `src/modules/profiles/services/claude-settings.service.ts:10-20`: JSON parse fail → trả `{}` (comment: "cs never fails on someone else's file"). `global-write.service.ts` spread `...settings` rồi ghi lại → toàn bộ key của user (`permissions`, `hooks`, `statusLine`, ...) bị xoá khỏi settings.json khi chạy `cs use`, không có backup `.corrupt` như cs.json có (`storage.service.ts:100-105`).
- Không test nào viết sẵn settings.json (đúng lẫn sai cú pháp) trước `cs use` — cả đường merge giữ key của user lẫn đường corrupt đều chưa được assert. Đây là guard có hành vi rủi ro nhất trong codebase nhưng không có test nào chạm vào.
- Fix đề xuất: corrupt → giữ nguyên file (hoặc backup `.corrupt` + notice), và thêm test: (a) `use` giữ nguyên key không phải của cs, (b) corrupt → không mất dữ liệu.

## High

### H1. install.sh: `CS_INSTALL_DIR` relative → cài vào temp dir rồi bị xoá
- `scripts/install.sh:22,28,36-37,23`: script `cd "$SRC/cs"` (mktemp clone) trước khi `mkdir -p "$INSTALL_DIR"`. Nếu user đặt `CS_INSTALL_DIR=bin` (relative), binary được ghi vào `$SRC/cs/bin`, rồi EXIT trap `rm -rf "$SRC"` xoá sạch — script vẫn in "cs installed".
- Fix: chuẩn hoá `INSTALL_DIR` về absolute ngay khi đọc (ví dụ `case "$INSTALL_DIR" in /*) ;; *) INSTALL_DIR="$PWD/$INSTALL_DIR";; esac` trước khi `cd`, hoặc dùng `cd` có kiểm soát).

### H2. vitest globalSetup build full bundle cho mọi lần chạy test
- `vitest.config.ts:15` + `tests/setup/global-setup.ts`: mỗi `vitest run` — kể cả `vitest run tests/banner.test.ts` — phải build cả bundle tsdown; nếu build fail, lỗi surfaceopaque qua globalSetup thay vì ở test liên quan. `bundle.test.ts:23` phụ thuộc cứng `dist/cli.mjs` nên không thể bỏ.
- `tsdown.config.ts:17` `clean: false` → stale artifact trong `dist/` sống sót qua build (rủi ro thấp với single-entry, nhưng thử nghiệm "build under test is the build the repo ships" phụ thuộc dist sạch).
- Fix: `globalSetup` chỉ build khi `dist/cli.mjs` thiếu/stale (hash check), hoặc tách bundle tests sang một project vitest riêng.

## Medium

### M1. Architecture scanner lách được bằng dynamic import
- `tests/support/architecture-rules.ts:66` regex `(?:from|import)\s+['"]` không match `await import('commander')` / `import('node:child_process')`; các rule `commander-in-command-files-only` (:158), `clack-in-ui-layer-only` (:168), `child-process-in-runner-only` (:189), `core-imports-no-command` (:128) đều dùng pattern `from\s+'...'` nên dynamic import vượt qua. Ngược lại, một string literal chứa `from 'commander'` sẽ false-positive.
- Fix: thêm pattern `import\s*\(\s*['"]` và chấp nhận trade-off false-positive, hoặc dùng `import-x/no-dynamic-import` cho scoped dirs trong ESLint (source of truth thứ hai đã có sẵn).

### M2. Guard không có test: `RESERVED_NAMES` của profile-name.check
- `src/modules/profiles/checks/profile-name.check.ts:13-15` chặn `__proto__`/`prototype`/`constructor`, nhưng không test nào chạy `config -n __proto__` hay `alias __proto__ ...` qua CLI (grep toàn tests: 0 hit). Test "never resolves a profile name that lives on the prototype" chỉ chứng minh `findProfile`/`findAliasTarget` dùng own-property, không chứng minh guard tên. Đường lỗi (error path) của guard hoàn toàn chưa assert.
- Fix: thêm 1 test CLI: `config -n __proto__` → stderr "Reserved name not allowed" + exit 1.

### M3. Toàn bộ action tương tác của `cs env` chưa có test
- Không có `runCli(['env'...])` nào trong tests (grep: 0); mọi test env đi qua service `applyEnvChange` trực tiếp. Các nhánh của `src/commands/env/env.command.ts` chưa được chạm: abort ở từng prompt (dòng 38-42, 65-69, 88-92, 120-130, 137-141), thông báo "No env keys set" (:101-107), vòng notices stderr (:154-156), validate của autocomplete.
- Kèm dead code: block `if (!isText(key))` bị lặp đúng 2 lần liền nhau ở `env.command.ts:120-130`.
- Fix: xoá block lặp; test các nhánh abort bằng mock `@clack/prompts` qua `vi.mock`.

### M4. `detectActiveProfile`: hai profile cùng URL → first-match wins, không có test
- `src/modules/profiles/services/active-profile.service.ts:22-40`: vòng lặp trả profile đầu tiên có URL khớp; nếu hai profile trùng `ANTHROPIC_BASE_URL` mà token của profile thứ hai khớp chính xác, vẫn chọn profile đầu (kể cả khi token đầu khác). `cs current` có thể hiển thị sai profile active. Không test cho trường hợp ambiguous này.
- Fix: prefer profile có token khớp chính xác trước khi rơi vào match đầu; thêm test seed 2 profile cùng URL.

### M5. install.sh: chi tiết vận hành
- `install.sh:26`: `git clone ... >/dev/null 2>&1` — mọi lỗi thật (auth, proxy, DNS) bị nuốt, user chỉ thấy "cloning failed". Nên giữ stderr.
- `install.sh:37`: `cp` đè lên file `cs` đang chạy → `ETXTBSY` trên Linux làm install fail giữa chừng dưới `set -e`; không atomic. Nên `cp` ra `cs.tmp` + `mv -f`.
- Không pin ref/đầu phát hành (clone HEAD của default branch, `--depth 1`) → cài không tái lập được; chỉ có check node version, không smoke-test binary sau copy (`"$INSTALL_DIR/cs" --version`).

## Low

- `package.json:2` `private: true` chặn `pnpm publish` dù `name/bin/files/engines` đã publish-ready — nhất quán với decision 0002 (curl installer), nhưng cần xác nhận npm distribution không phải mục tiêu.
- `mask-token.util.ts:6-7`: nhánh `token.length <= 8` (reveal 2 ký tự đầu) không có unit test; các test chỉ qua stdout với token dài.
- `.prettierignore` liệt kê `package-lock.json`/`yarn.lock`/`bun.lock` — không thể tồn tại trong repo pnpm-only; noise.
- `tests/support/temp-home.ts` đổi `HOME`; `homedir()` của Node chỉ tôn trọng `HOME` trên POSIX — trên Windows test sẽ ghi vào profile thật. Repo nhắm POSIX launcher nên chấp nhận được; ghi lại giới hạn.
- Các `allow: ['cli.ts']` trong rules `no-process-exit` / `no-global-process-handlers` hiện là dead allowance (cli.ts không dùng cả hai) và không có fixture chứng minh phía allow — chỉ được phủ gián tiếp bởi real-src scan. Chấp nhận được.

## Positive Observations (risk calibration)

- Không tìm thấy assertion vacuous; các test khẳng định nội dung đúng (`bundle.test.ts:88` so sánh chính xác `"${pkg.version}\n"`) và exit code.
- `bundle.test.ts:126-135` chứng minh chạy qua symlink và từ chối `-V` — đúng kịch bản bin shim thật; tsdown xác nhận chmod +x ("Granting execute permission to dist/cli.mjs").
- Auth guard matrix (token vs oauth, token-without-url kể cả qua inheritance, oauth sau khi clear token) được phủ tốt trong `config.command.test.ts` và `use.command.test.ts`.
- Packaging: `bin: dist/cli.mjs` ⊂ `files: ["dist"]`; `UNRESOLVED_IMPORT` được nâng thành error (`tsdown.config.ts:27-29`); `engineStrict: true` trong pnpm-workspace; lint-staged glob đã kiểm chứng khớp đúng file staged bằng micromatch.

## Recommended Actions

1. Thêm CI (lint + typecheck + test) — C1.
2. Bảo vệ settings.json khỏi corrupt-write + thêm test merge/corrupt — C2.
3. Sửa `CS_INSTALL_DIR` relative trong install.sh — H1.
4. Giảm chi phí globalSetup build + `clean: true` — H2.
5. Test reserved profile names, dynamic-import scanner, các nhánh abort của `cs env`; xoá dead code `env.command.ts:120-130` — M1-M3.

## Metrics

- Tests: 220 pass / 19 files / ~0.8s | Lint: 0 lỗi | Typecheck: 0 lỗi
- Coverage gaps đã đặt tên: settings.json merge/corrupt, interactive `cs env`, reserved names, maskToken ngắn, ambiguous active-profile, dynamic import scanner.

## Unresolved Questions

- npm distribution có dự kiến không (quyết định `private: true`)?
- C2: hành vi mong muốn khi settings.json corrupt — bỏ qua + notice, hay backup `.corrupt` như cs.json? Đây là policy, cần decision.
