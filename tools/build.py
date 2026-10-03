#!/usr/bin/env python3
"""Bundle the Niveus sources into a single stylesheet.

`niveus/niveus.css` is the authored entry point and works as-is over HTTP: the
browser resolves the @import chain itself. That costs a request per file and,
more importantly, blocks rendering until the whole chain has loaded — so for
anything shipped, this script flattens the chain into `dist/niveus.css`.

Each `@import url("…") layer(name)` becomes a `@layer name { … }` block holding
the file's contents, which is exactly equivalent to what the browser does with
the import. Nothing is minified and nothing is reordered; the output is meant
to stay readable and to diff cleanly against the sources.

    python3 tools/build.py [--check]

--check verifies dist/ is current without writing, for use in CI.
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ENTRY = ROOT / "niveus" / "niveus.css"
OUTPUT = ROOT / "dist" / "niveus.css"

IMPORT = re.compile(
    r"""@import\s+url\(\s*["']([^"']+)["']\s*\)\s*(?:layer\(\s*([^)]+?)\s*\))?\s*;""",
    re.VERBOSE,
)


def indent(text: str, prefix: str = "  ") -> str:
    return "\n".join(prefix + line if line.strip() else line for line in text.split("\n"))


def bundle(path: Path, seen: set[Path] | None = None) -> str:
    """Inline every @import in `path`, depth first."""
    seen = seen if seen is not None else set()
    resolved = path.resolve()
    if resolved in seen:
        raise SystemExit(f"circular @import involving {resolved.relative_to(ROOT)}")
    seen.add(resolved)

    source = path.read_text(encoding="utf-8")
    out: list[str] = []
    cursor = 0

    for match in IMPORT.finditer(source):
        out.append(source[cursor : match.start()])
        cursor = match.end()

        target = (path.parent / match.group(1)).resolve()
        if not target.is_file():
            raise SystemExit(f"{path.relative_to(ROOT)}: cannot resolve {match.group(1)}")

        # The import's own comment header is kept; it explains the section.
        contents = bundle(target, seen).strip("\n")
        layer = match.group(2)
        if layer:
            out.append(f"@layer {layer} {{\n{indent(contents)}\n}}")
        else:
            out.append(contents)

    out.append(source[cursor:])
    seen.discard(resolved)
    return "".join(out)


def build() -> str:
    header = (
        "/* Niveus — generated bundle. Do not edit.\n"
        "   Source: niveus/niveus.css and the files it imports.\n"
        "   Rebuild: python3 tools/build.py\n"
        "*/\n\n"
    )
    body = bundle(ENTRY)
    # Collapse the runs of blank lines left behind by the inlined imports.
    body = re.sub(r"\n{3,}", "\n\n", body).strip() + "\n"
    return header + body


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--check",
        action="store_true",
        help="fail if dist/niveus.css differs from the sources",
    )
    args = parser.parse_args()

    result = build()

    if args.check:
        current = OUTPUT.read_text(encoding="utf-8") if OUTPUT.is_file() else None
        if current != result:
            print("dist/niveus.css is out of date — run: python3 tools/build.py")
            return 1
        print("dist/niveus.css is up to date")
        return 0

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(result, encoding="utf-8")
    size = len(result.encode("utf-8"))
    print(f"wrote {OUTPUT.relative_to(ROOT)} ({size:,} bytes)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
