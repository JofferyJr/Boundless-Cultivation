"""
Boundless Cultivation - Snapshot Site Tool (REFINED v1.1)
Snapshot same-origin static site into GitHub Pages project path.
Fix: path traversal, queue performance, rewrite safety, defaults.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import mimetypes
import re
from collections import deque
from dataclasses import dataclass
from pathlib import Path, PurePosixPath
from typing import Callable
from urllib.parse import urljoin, urlparse, urlunparse
import urllib.request

_TEXT_TYPES = (
    "text/",
    "application/javascript",
    "application/x-javascript",
    "application/json",
    "application/xml",
    "image/svg+xml",
)

_URL_PATTERNS = [
    re.compile(r'''(?:src|href|poster)\s*=\s*["']([^"']+)["']''', re.I),
    re.compile(r'''url\(\s*["']?([^"')]+)["']?\s*\)''', re.I),
    re.compile(r'''["']((?:https?://[^"']+|/[^"']+|\./[^"']+|\.\./[^"']+))["']'''),
]

_CLOUDFLARE_BLOCK = re.compile(
    r"<script\b[^>]*>(?:(?!</script>).)*(?:__CF\$cv\$params|/cdn-cgi/challenge-platform)(?:(?!</script>).)*</script>",
    re.I | re.S,
)

_STATIC_EXTENSIONS = {
    ".html", ".htm", ".css", ".js", ".mjs", ".cjs", ".json", ".map",
    ".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg", ".ico",
    ".woff", ".woff2", ".ttf", ".otf", ".webmanifest", ".wasm",
    ".mp3", ".ogg", ".wav", ".mp4", ".webm",
}


def _sanitize_hosting_injections(text: str, path: Path) -> str:
    if path.suffix.lower() in {".html", ".htm"}:
        text = _CLOUDFLARE_BLOCK.sub("", text)
    return text


@dataclass
class Response:
    url: str
    body: bytes
    content_type: str


def _default_fetch(url: str) -> Response:
    request = urllib.request.Request(
        url,
        headers={
            "User-Agent": "BoundlessCultivation-GitHub-Migration/1.1",
            "Accept": "*/*",
        },
    )
    with urllib.request.urlopen(request, timeout=60) as resp:
        content_type = resp.headers.get_content_type() or mimetypes.guess_type(url)[0] or "application/octet-stream"
        return Response(resp.geturl(), resp.read(), content_type)


def _strip_fragment(url: str) -> str:
    parsed = urlparse(url)
    return urlunparse(parsed._replace(fragment=""))


def _same_origin(a: str, b: str) -> bool:
    pa, pb = urlparse(a), urlparse(b)
    return (pa.scheme, pa.netloc) == (pb.scheme, pb.netloc)


def _is_ignored_ref(ref: str) -> bool:
    lower = ref.strip().lower()
    return (
        not lower
        or lower.startswith(("data:", "blob:", "javascript:", "mailto:", "tel:", "#", "about:"))
    )


def _looks_fetchable(ref: str) -> bool:
    if not ref.startswith(("http://", "https://", "/", "./", "../")):
        return False
    path = urlparse(ref).path.lower()
    if any(marker in path for marker in ("/assets/", "/static/", "/_next/", "/build/", "/dist/")):
        return True
    return PurePosixPath(path).suffix in _STATIC_EXTENSIONS


def _safe_local_path(url: str, root_url: str) -> Path:
    """REFFINED: cegah path traversal dan double index.html"""
    parsed = urlparse(url)
    path = parsed.path or "/"
    
    # Normalize - buang .. untuk elak traversal
    parts = []
    for p in PurePosixPath(path).parts:
        if p in ("..",):
            if parts:
                parts.pop()
            continue
        if p in ("/",):
            continue
        parts.append(p)
    path = "/" + "/".join(parts) if parts else "/"

    if path.endswith("/"):
        path += "index.html"
    elif not PurePosixPath(path).suffix:
        # Kalau path macam /about tanpa extension, jadikan /about/index.html
        if not path.endswith("/index.html"):
            path = path.rstrip("/") + "/index.html"

    # Handle query string - hash untuk uniqueness
    if parsed.query:
        p = PurePosixPath(path)
        digest = hashlib.sha256(parsed.query.encode("utf-8")).hexdigest()[:10]
        if p.suffix:
            path = str(p.with_name(f"{p.stem}-{digest}{p.suffix}"))
        else:
            path = str(p.with_name(f"{p.name}-{digest}"))

    # Final safety - pastikan tak keluar dari root
    safe = Path(path.lstrip("/"))
    # Buang sebarang .. yang masih tinggal
    safe = Path(*[x for x in safe.parts if x != ".."])
    return safe


class Snapshotter:
    def __init__(
        self,
        root_url: str,
        project_base: str,
        *,
        fetch: Callable[[str], Response] | None = None,
        max_files: int = 5000,
    ):
        self.root_url = root_url if root_url.endswith("/") else root_url + "/"
        base = project_base.strip("/").strip()
        self.project_base = "/" + base if base else ""
        self.fetch = fetch or _default_fetch
        self.origin = f"{urlparse(self.root_url).scheme}://{urlparse(self.root_url).netloc}"
        self.max_files = max_files

    def _extract_refs(self, text: str) -> set[str]:
        refs: set[str] = set()
        for pattern in _URL_PATTERNS:
            for match in pattern.finditer(text):
                ref = match.group(1).strip()
                if _is_ignored_ref(ref):
                    continue
                if _looks_fetchable(ref):
                    refs.add(ref)
        return refs

    def _decode(self, body: bytes) -> str:
        return body.decode("utf-8", errors="replace")

    def _is_text(self, content_type: str, path: Path) -> bool:
        c = content_type.lower().split(";", 1)[0].strip()
        return c.startswith(_TEXT_TYPES) or path.suffix.lower() in {
            ".html", ".htm", ".css", ".js", ".mjs", ".json", ".svg", ".txt", ".map"
        }

    def _project_url_for(self, absolute_url: str) -> str:
        parsed = urlparse(absolute_url)
        path = parsed.path or "/"
        if path == "/":
            return self.project_base + "/" if self.project_base else "/"
        return self.project_base + path

    def _rewrite_text(self, text: str, current_url: str, fetched_urls: set[str]) -> str:
        # REFINED: sort by length desc untuk elak partial replace, guna boundary check
        for absolute in sorted(fetched_urls, key=len, reverse=True):
            parsed = urlparse(absolute)
            project = self._project_url_for(absolute)
            # Replace full URL
            text = text.replace(absolute, project)
            # Replace path-only jika path unik
            if parsed.path and parsed.path not in ("/", "") and len(parsed.path) > 1:
                # Elak replace / yang terlalu generik
                if parsed.path.count("/") >= 1 and len(parsed.path) > 3:
                    text = text.replace(f'"{parsed.path}"', f'"{project}"')
                    text = text.replace(f"'{parsed.path}'", f"'{project}'")
        return text

    def snapshot(self, output_root: Path) -> dict:
        output_root.mkdir(parents=True, exist_ok=True)
        queue: deque[str] = deque([self.root_url])
        seen: set[str] = set()
        fetched: dict[str, Response] = {}
        external: set[str] = set()
        failures: list[dict] = []

        while queue:
            if len(fetched) >= self.max_files:
                failures.append({"url": "limit", "error": f"max files {self.max_files} reached"})
                break

            url = _strip_fragment(queue.popleft())
            if url in seen:
                continue
            seen.add(url)
            
            if not _same_origin(url, self.root_url):
                external.add(url)
                continue
                
            try:
                response = self.fetch(url)
            except Exception as exc:
                failures.append({"url": url, "error": str(exc)})
                continue

            final_url = _strip_fragment(response.url)
            if final_url in fetched:
                continue

            fetched[final_url] = response
            local_path = _safe_local_path(final_url, self.root_url)

            if self._is_text(response.content_type, local_path):
                text = _sanitize_hosting_injections(self._decode(response.body), local_path)
                for ref in self._extract_refs(text):
                    absolute = _strip_fragment(urljoin(final_url, ref))
                    if _same_origin(absolute, self.root_url):
                        if absolute not in seen:
                            queue.append(absolute)
                    else:
                        # Hanya track external kalau ia bukan CDN yang dibenarkan
                        if "chatgpt.site" in absolute or "cloudflare" in absolute.lower():
                            external.add(absolute)
                        elif absolute.startswith(("http://", "https://")):
                            # Track semua external untuk audit
                            external.add(absolute)

        # Write files
        fetched_urls = set(fetched)
        files = []
        for url, response in fetched.items():
            local_path = _safe_local_path(url, self.root_url)
            target = output_root / local_path
            
            # Double check traversal
            try:
                target.resolve().relative_to(output_root.resolve())
            except ValueError:
                failures.append({"url": url, "error": f"path traversal blocked: {local_path}"})
                continue

            target.parent.mkdir(parents=True, exist_ok=True)
            body = response.body
            if self._is_text(response.content_type, local_path):
                text = _sanitize_hosting_injections(self._decode(body), local_path)
                text = self._rewrite_text(text, url, fetched_urls)
                body = text.encode("utf-8")
            target.write_bytes(body)
            files.append({
                "url": url,
                "path": local_path.as_posix(),
                "content_type": response.content_type,
                "bytes": len(body),
                "sha256": hashlib.sha256(body).hexdigest(),
            })

        report = {
            "source": self.root_url,
            "project_base": self.project_base or "/",
            "downloaded": len(files),
            "files": sorted(files, key=lambda x: x["path"]),
            "external_references": sorted(external),
            "failures": failures,
        }
        (output_root / "snapshot-manifest.json").write_text(
            json.dumps(report, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
        return report


def main() -> int:
    parser = argparse.ArgumentParser(description="Snapshot same-origin static site into GitHub Pages")
    parser.add_argument("--url", required=True, help="Source URL to snapshot")
    parser.add_argument("--output", required=True, help="Output directory")
    parser.add_argument("--project-base", default="/Boundless-Cultivation", help="GitHub Pages project base path")
    parser.add_argument("--max-files", type=int, default=5000, help="Max files to download")
    args = parser.parse_args()
    
    report = Snapshotter(args.url, args.project_base, max_files=args.max_files).snapshot(Path(args.output))
    print(json.dumps({
        "downloaded": report["downloaded"],
        "failures": len(report["failures"]),
        "external_references": len(report["external_references"]),
    }, indent=2))
    return 1 if report["failures"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
