import argparse
import datetime
import hashlib
import os
import sys
import urllib.request
from pathlib import Path

from hc04.config import (
    DATA_DIR,
    DEFAULT_ARCHIVE_NAME,
    DEFAULT_DOWNLOAD_URL,
    FALLBACK_DOWNLOAD_URL,
    RAW_DATA_PATH,
)


def compute_sha256(filepath: Path) -> str:
    """Calculates the SHA256 hash of a file in chunks."""
    sha256_hash = hashlib.sha256()
    with open(filepath, "rb") as f:
        for chunk in iter(lambda: f.read(65536 * 16), b""):
            sha256_hash.update(chunk)
    return sha256_hash.hexdigest()


def write_dataset_records(
    filepath: Path,
    source_url: str,
    sha256_hash: str,
    file_size_bytes: int,
):
    """Writes data/DATASET_INFO.md and data/SHA256.txt reproducibility records."""
    timestamp = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    size_mb = file_size_bytes / (1024 * 1024)

    # 1. Write SHA256.txt
    sha_file = DATA_DIR / "SHA256.txt"
    with open(sha_file, "w", encoding="utf-8") as f:
        f.write(f"{sha256_hash}  {filepath.name}\n")

    # 2. Write DATASET_INFO.md
    info_file = DATA_DIR / "DATASET_INFO.md"
    content = f"""# ClinVar Dataset Reproducibility Record

- **Archive Filename**: `{filepath.name}`
- **Download Source**: `{source_url}`
- **SHA256 Hash**: `{sha256_hash}`
- **File Size**: `{file_size_bytes:,} bytes` ({size_mb:.2f} MB)
- **Processing Timestamp**: `{timestamp}`
- **Local Storage Path**: `{filepath.resolve()}`

---
*Generated automatically by HC-04 ClinVar Conflict Triage Data Ingestion Pipeline.*
"""
    with open(info_file, "w", encoding="utf-8") as f:
        f.write(content)

    print(f"✅ Created reproducibility records:")
    print(f"   -> {sha_file}")
    print(f"   -> {info_file}")


def download_clinvar_archive(
    target_path: Path = RAW_DATA_PATH,
    url: str = DEFAULT_DOWNLOAD_URL,
    force: bool = False,
) -> Path:
    """Downloads the official ClinVar archive with automatic HTTP Range resume support."""
    env_local_path = os.environ.get("CLINVAR_ARCHIVE_PATH")
    if env_local_path and Path(env_local_path).is_file() and not force:
        print(f"📦 Found local dataset from CLINVAR_ARCHIVE_PATH: {env_local_path}")
        target_path = Path(env_local_path)
    else:
        target_path.parent.mkdir(parents=True, exist_ok=True)

        # Check remote Content-Length
        head_req = urllib.request.Request(url, headers={"User-Agent": "GenomeX-HC04-Triage/1.0"}, method="HEAD")
        total_size = 0
        try:
            with urllib.request.urlopen(head_req, timeout=30) as resp:
                total_size = int(resp.info().get("Content-Length", 0))
        except Exception:
            pass

        existing_size = target_path.stat().st_size if target_path.is_file() else 0

        if not force and total_size > 0 and existing_size == total_size:
            print(f"📦 Found complete local dataset at: {target_path} ({existing_size:,} bytes)")
        else:
            if existing_size > 0 and not force and total_size > 0 and existing_size < total_size:
                print(f"🔄 Resuming download from byte {existing_size:,} / {total_size:,}...")
                headers = {"User-Agent": "GenomeX-HC04-Triage/1.0", "Range": f"bytes={existing_size}-"}
                mode = "ab"
                downloaded = existing_size
            else:
                print(f"⬇️ Downloading official ClinVar archive from:\n   {url}")
                print(f"   Target destination: {target_path}")
                headers = {"User-Agent": "GenomeX-HC04-Triage/1.0"}
                mode = "wb"
                downloaded = 0

            try:
                req = urllib.request.Request(url, headers=headers)
                with urllib.request.urlopen(req, timeout=180) as response, open(target_path, mode) as out_file:
                    chunk_size = 1024 * 512  # 512 KB
                    while True:
                        chunk = response.read(chunk_size)
                        if not chunk:
                            break
                        out_file.write(chunk)
                        downloaded += len(chunk)
                        if total_size > 0:
                            pct = (downloaded / total_size) * 100
                            mb_down = downloaded / (1024 * 1024)
                            mb_total = total_size / (1024 * 1024)
                            print(f"\r   [{pct:5.1f}%] {mb_down:6.1f}MB / {mb_total:6.1f}MB", end="", flush=True)
                print()
            except Exception as e:
                print(f"\n⚠️ Primary download error: {e}")
                if url != FALLBACK_DOWNLOAD_URL:
                    print(f"🔄 Retrying with fallback: {FALLBACK_DOWNLOAD_URL}")
                    return download_clinvar_archive(target_path, FALLBACK_DOWNLOAD_URL, force)
                raise

    # Compute hash and write reproducibility metadata
    file_size = target_path.stat().st_size
    print(f"🔒 Calculating SHA256 checksum for {target_path.name} ({file_size / (1024 * 1024):.1f} MB)...")
    file_sha256 = compute_sha256(target_path)
    print(f"   SHA256: {file_sha256}")

    write_dataset_records(target_path, url, file_sha256, file_size)
    return target_path


def main():
    parser = argparse.ArgumentParser(description="Download official ClinVar archive for HC-04.")
    parser.add_argument("--local-path", type=str, default=None, help="Path to existing local ClinVar archive.")
    parser.add_argument("--url", type=str, default=DEFAULT_DOWNLOAD_URL, help="ClinVar archive download URL.")
    parser.add_argument("--force", action="store_true", help="Force re-download even if file exists.")
    args = parser.parse_args()

    if args.local_path:
        local_p = Path(args.local_path)
        if not local_p.is_file():
            print(f"❌ Error: Specified local path does not exist: {local_p}")
            sys.exit(1)
        sha = compute_sha256(local_p)
        write_dataset_records(local_p, "Local user copy", sha, local_p.stat().st_size)
        print(f"✅ Local dataset registered successfully: {local_p}")
        return

    download_clinvar_archive(url=args.url, force=args.force)


if __name__ == "__main__":
    main()
