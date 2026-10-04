"""
Boundless Cultivation - Static Runtime Audit (REFINED v1.1)
Audit untuk pastikan tiada reference ke hosting lama / iframe / SiteGPT.
Fix: configurable host, lebih banyak check, report terstruktur.
"""
from __future__ import annotations

import argparse
import re
from pathlib import Path
from dataclasses import dataclass

TEXT_SUFFIXES = {'.html', '.htm', '.js', '.mjs', '.cjs', '.css', '.json', '.svg', '.txt', '.map'}
DEFAULT_OLD_HOSTS = [
    'jalan-dao-xianxia.jofferyjr.chatgpt.site',
    'chatgpt.site',
]

@dataclass
class AuditError:
    file: str
    type: str
    detail: str
    
    def __str__(self):
        return f"{self.file}: {self.type} - {self.detail}"


def audit_runtime(root: Path, old_hosts: list[str] | None = None) -> list[AuditError]:
    errors: list[AuditError] = []
    hosts = old_hosts or DEFAULT_OLD_HOSTS
    
    if not root.exists():
        return [AuditError(str(root), "missing", f"runtime root missing: {root}")]

    # Pattern tambahan untuk security
    PATTERNS = {
        'iframe': re.compile(r'<iframe', re.I),
        'refresh_redirect': re.compile(r'http-equiv\s*=\s*["\']?refresh', re.I),
        'sitegpt_fetch': re.compile(r'fetch\s*\(\s*["\']https?://[^"\']*chatgpt\.site', re.I),
        'sitegpt_nav': re.compile(r'(?:window\.)?location(?:\.href)?\s*=\s*["\']https?://[^"\']*chatgpt\.site', re.I),
        'external_script': re.compile(r'<script[^>]+src\s*=\s*["\']https?://(?!cdn\.jsdelivr|unpkg|cdnjs)[^"\']+["\']', re.I),
        'eval_usage': re.compile(r'\beval\s*\(', re.I),
        'cloudflare_challenge': re.compile(r'__CF\$cv\$params|/cdn-cgi/challenge-platform', re.I),
    }

    for path in root.rglob('*'):
        if not path.is_file():
            continue
        # Skip binary & hidden
        if path.suffix.lower() not in TEXT_SUFFIXES:
            continue
        if any(part.startswith('.') for part in path.parts):
            continue
            
        try:
            text = path.read_text(encoding='utf-8', errors='replace')
        except OSError as exc:
            errors.append(AuditError(path.relative_to(root).as_posix(), "unreadable", str(exc)))
            continue
            
        lower = text.lower()
        rel = path.relative_to(root).as_posix()

        # Check old hosts
        for host in hosts:
            if host.lower() in lower:
                errors.append(AuditError(rel, "old_host", f"reference to {host}"))

        # Check patterns
        for ptype, pattern in PATTERNS.items():
            if pattern.search(text):
                # Whitelist: benarkan eval dalam snapshot tool sendiri
                if ptype == 'eval_usage' and 'snapshot_site' in rel:
                    continue
                errors.append(AuditError(rel, ptype, f"{ptype} found"))

    return errors


def main() -> int:
    parser = argparse.ArgumentParser(description="Audit static runtime for external dependencies")
    parser.add_argument('root', nargs='?', default='site', help="Root directory to audit")
    parser.add_argument('--hosts', nargs='*', default=DEFAULT_OLD_HOSTS, help="Old hosts to check")
    parser.add_argument('--json', action='store_true', help="Output JSON")
    args = parser.parse_args()
    
    errors = audit_runtime(Path(args.root), old_hosts=args.hosts)
    
    if args.json:
        import json
        print(json.dumps([{"file": e.file, "type": e.type, "detail": e.detail} for e in errors], indent=2))
    else:
        if errors:
            for error in errors:
                print(error)
        else:
            print('Static runtime audit: PASS ✓')
            
    return 1 if errors else 0


if __name__ == '__main__':
    raise SystemExit(main())
