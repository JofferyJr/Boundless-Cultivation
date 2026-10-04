# PR: Fix GitHub Pages runtime - refine index + weapon system + tools

## Apa yang di-fix

### 1. `site/index.html` - CRITICAL
- Fix `charSet` -> `charset`
- Buang duplicate `modulepreload` untuk `index-Cyw089Xg.js`
- Tambah `type="module"` pada `import("/Boundless-Cultivation/assets/index-Cyw089Xg.js")`
- Pindahkan semua `self.__VINEXT_RSC_CHUNKS__` dari luar `</html>` ke dalam `</body>` - invalid HTML5
- Fix path dalam RSC payload `/assets/` -> `/Boundless-Cultivation/assets/`
- Buang dev artifacts: `v819-dev-realm-editor.css/js`, `v818-settings-slot-bridge.js`, `codex-preview` meta
- Susun semula `<head>` dengan comments untuk production

### 2. `site/assets/v819-weapon-system.js` - BUG
- FIX utama: `opts(TYPES, TYPES.sword.id)` -> `TYPES.sword.id` tak wujud, selected tak jalan
- Tambah `id` dalam semua TYPES entries
- `load()` & `save()` tambah try/catch - elak crash kalau localStorage penuh
- Semua `querySelector` ada null check
- Tambah `removeWeapon()` function
- `forge()` logik tribulation diperbaiki - tolak material hanya sekali
- `log` limit 100 entries elak bloat

### 3. `site/assets/v819-weapon-system.css` - TYPO
- FIX: `.bc-wpn-overlay` -> `#bc-wpn-overlay` dalam media query 520px - responsive tak jalan sebelum ni
- Tambah CSS variables `:root` --wp-gold, --wp-border etc
- Tambah backdrop-filter blur, animation wpFadeIn & wpPop
- Hover/active states, custom scrollbar, focus-visible
- 3-tier responsive: 1200px, 900px, 520px
- prefers-reduced-motion support

### 4. `tools/snapshot_site.py`
- FIX: queue.pop(0) O(n) -> deque.popleft() O(1)
- FIX: path traversal vulnerability dalam _safe_local_path
- FIX: default project_base /Cultivation -> /Boundless-Cultivation
- Tambah max_files limit 5000, double-check traversal dengan resolve().relative_to()

### 5. `tools/audit_static_runtime.py`
- FIX: OLD_HOST hardcoded -> DEFAULT_OLD_HOSTS list + --hosts CLI
- Tambah checks: external_script, eval_usage, cloudflare_challenge
- Structured AuditError dataclass + --json output

### 6. `tools/release_audit.py`
- FIX: duplicate CURRENT_GAME_VERSION line 19 & 22
- FIX: version check guna string `in` -> regex lebih tepat
- FIX: manifest_path hardcoded 1 lokasi -> cuba 3 lokasi
- Tambah weapon_system feature check

## Testing
```bash
python tools/audit_static_runtime.py site
python tools/release_audit.py --root . --write docs/audit.md
```

## Deployment
Push ke main akan auto-deploy via .github/workflows GitHub Pages.

## Checklist index diubah
Kalau ubah index lepas ni:
- [ ] Build semula dengan Vite
- [ ] Check selector .equipment-section dalam weapon JS
- [ ] Update version dalam release_audit.py
- [ ] Run audit tools
- [ ] Regenerate snapshot-manifest.json
