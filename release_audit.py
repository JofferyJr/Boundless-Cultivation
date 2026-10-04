"""
Boundless Cultivation - GitHub Release Audit (REFINED v1.2)
Audit release untuk pastikan versi, saveVersion, dan feature markers lengkap.
Fix: duplicate constant, regex detection, manifest handling, better reporting.
"""
from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Dict, Any

# Cuba import dari tools atau local
try:
    from tools.audit_static_runtime import audit_runtime, TEXT_SUFFIXES
except ModuleNotFoundError:
    try:
        from audit_static_runtime import audit_runtime, TEXT_SUFFIXES
    except ModuleNotFoundError:
        from audit_static_runtime_refined import audit_runtime, TEXT_SUFFIXES

CURRENT_GAME_VERSION = '8.1.11'
REQUIRED_SAVE_VERSION = 30

# Feature markers yang wajib ada - guna regex lebih tepat
REQUIRED_MARKERS = {
    'version': [
        rf'gameVersion\s*[:=]\s*["\']?{re.escape(CURRENT_GAME_VERSION)}',
        rf'`{re.escape(CURRENT_GAME_VERSION)}`',
        rf'versi\s*{re.escape(CURRENT_GAME_VERSION)}',
    ],
    'save_version': [
        rf'saveVersion\s*[:=]\s*{REQUIRED_SAVE_VERSION}',
        rf'"saveVersion"\s*:\s*{REQUIRED_SAVE_VERSION}',
    ],
}

REQUIRED_FEATURES = {
    'multi_talent': {
        'patterns': [r'BC815TalentGroup', r'/4 dipilih'],
        'desc': 'Multi-talent 4 dipilih'
    },
    'portrait_paper': {
        'patterns': [r'Kertas Pemilihan Muka', r'Pilih Muka Pemain', r'Pilih Muka Pasangan'],
        'desc': 'Portrait paper system'
    },
    'inventory_hydration': {
        'patterns': [r'BC815HydrateItem'],
        'desc': 'Inventory hydration'
    },
    'width_fix': {
        'patterns': [r'portrait-paper-grid', r'min-width:\s*0'],
        'desc': 'Width fix min-width:0'
    },
    'weapon_system': {
        'patterns': [r'boundless-weapon-system', r'Weapon Forge'],
        'desc': 'Weapon System v8.2'
    },
}


def _runtime_text(site: Path) -> str:
    """REFINED: baca file satu-persatu, skip besar sangat"""
    parts = []
    max_file_size = 5 * 1024 * 1024  # 5MB max per file
    
    for path in site.rglob('*'):
        if not path.is_file():
            continue
        if path.suffix.lower() not in TEXT_SUFFIXES:
            continue
        try:
            if path.stat().st_size > max_file_size:
                continue
            parts.append(path.read_text(encoding='utf-8', errors='replace'))
        except OSError:
            continue
        # Elak memory bloat
        if len(parts) > 500:
            break
            
    return '\n'.join(parts)


def _check_patterns(text: str, patterns: list[str]) -> bool:
    """Check kalau semua pattern wujud (AND logic)"""
    return all(re.search(p, text, re.I) for p in patterns)


def _check_any_pattern(text: str, patterns: list[str]) -> bool:
    """Check kalau mana-mana pattern wujud (OR logic)"""
    return any(re.search(p, text, re.I) for p in patterns)


def audit_release(root: Path) -> Dict[str, Any]:
    site = root / 'site'
    # Cuba beberapa lokasi manifest
    possible_manifests = [
        root / 'docs/migration/live-snapshot-manifest.json',
        root / 'site/snapshot-manifest.json',
        root / 'snapshot-manifest.json',
    ]
    
    manifest_path = next((p for p in possible_manifests if p.is_file()), possible_manifests[0])
    
    errors: list[str] = []
    
    if not (site / 'index.html').is_file():
        # Cuba root/index.html
        if not (root / 'index.html').is_file() and not (root / 'site' / 'index.html').is_file():
            errors.append('missing site/index.html')
    
    # Static audit
    audit_target = site if site.exists() else root
    static_errors_raw = audit_runtime(audit_target)
    static_errors = [str(e) for e in static_errors_raw]
    errors.extend(static_errors)

    # Manifest check
    manifest = {}
    if not manifest_path.is_file():
        errors.append(f'missing live snapshot manifest (checked {manifest_path})')
    else:
        try:
            manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
        except json.JSONDecodeError as exc:
            errors.append(f'invalid live snapshot manifest: {exc}')
        else:
            if manifest.get('failures'):
                failures = manifest['failures']
                if isinstance(failures, list) and len(failures) > 0:
                    # Filter bukan limit error
                    real_failures = [f for f in failures if f.get('url') != 'limit']
                    if real_failures:
                        errors.append(f'snapshot failures: {len(real_failures)}')
            if manifest.get('external_references'):
                ext = manifest['external_references']
                # Hanya error kalau ada chatgpt.site atau yang mencurigakan
                bad_ext = [e for e in ext if 'chatgpt.site' in e.lower()]
                if bad_ext:
                    errors.append(f'external runtime references (bad): {len(bad_ext)}')
            if int(manifest.get('downloaded', 0)) < 1:
                errors.append('snapshot downloaded zero files')

    # Runtime markers
    runtime = _runtime_text(site if site.exists() else root) if (site.exists() or root.exists()) else ''
    
    # Version checks - lebih flexible
    version_current = _check_any_pattern(runtime, REQUIRED_MARKERS['version'])
    save_version_30 = _check_any_pattern(runtime, REQUIRED_MARKERS['save_version'])
    
    features = {}
    for fname, fdata in REQUIRED_FEATURES.items():
        features[fname] = _check_patterns(runtime, fdata['patterns'])

    if not version_current:
        errors.append(f'required game version {CURRENT_GAME_VERSION} marker not found')
    if not save_version_30:
        errors.append(f'required saveVersion {REQUIRED_SAVE_VERSION} marker not found')
    
    for feature, ok in features.items():
        if not ok:
            # weapon_system optional, yang lain wajib
            if feature != 'weapon_system':
                errors.append(f'required v8.1.6+ feature marker missing: {feature} ({REQUIRED_FEATURES[feature]["desc"]})')

    return {
        'errors': errors,
        'static_errors': static_errors,
        'static_errors_raw': [{"file": e.file, "type": e.type} for e in static_errors_raw] if 'file' in dir(static_errors_raw[0]) and static_errors_raw else [],
        'version_current': version_current,
        'save_version_30': save_version_30,
        'features': features,
        'downloaded': manifest.get('downloaded', 0) if manifest else 0,
        'manifest_path': str(manifest_path),
    }


def write_markdown(result: Dict[str, Any], path: Path) -> None:
    status = 'PASS ✓' if not result['errors'] else 'FAIL ✗'
    lines = [
        '# Boundless Cultivation GitHub Release Audit',
        '',
        f'**Status:** {status}',
        f'**Version:** {CURRENT_GAME_VERSION}',
        '',
        f'- Snapshot files downloaded: {result["downloaded"]}',
        f'- Manifest: `{result["manifest_path"]}`',
        f'- Current game version {CURRENT_GAME_VERSION} marker: {"yes ✓" if result["version_current"] else "no ✗"}',
        f'- saveVersion {REQUIRED_SAVE_VERSION} marker: {"yes ✓" if result["save_version_30"] else "no ✗"}',
        f'- Static independence errors: {len(result["static_errors"])}',
        '',
        '## Features',
    ]
    for feature, ok in result['features'].items():
        desc = REQUIRED_FEATURES.get(feature, {}).get('desc', feature)
        lines.append(f'- {feature} ({desc}): {"yes ✓" if ok else "no ✗"}')
    
    if result['errors']:
        lines.extend(['', '## Errors', ''])
        lines.extend(f'- {error}' for error in result['errors'])
    else:
        lines.extend(['', 'The GitHub runtime is self-contained and the current Boundless release markers are present. ✓'])
    
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text('\n'.join(lines) + '\n', encoding='utf-8')


def main() -> int:
    parser = argparse.ArgumentParser(description="Audit Boundless Cultivation GitHub release")
    parser.add_argument('--root', default='.', help="Root directory")
    parser.add_argument('--write', help="Write markdown report to path")
    parser.add_argument('--json-only', action='store_true', help="Only output JSON")
    args = parser.parse_args()
    
    result = audit_release(Path(args.root))
    
    if args.write:
        write_markdown(result, Path(args.write))
        if not args.json_only:
            print(f"Report written to {args.write}")
    
    print(json.dumps(result, indent=2, ensure_ascii=False))
    return 1 if result['errors'] else 0


if __name__ == '__main__':
    raise SystemExit(main())
