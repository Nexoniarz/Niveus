#!/usr/bin/env python3
"""Check that the Niveus sources hold to their own rules.

Four things go wrong in a design system long before anything looks broken, and
all four are mechanical:

  1. A semantic token is defined for one appearance but not the other, so a
     role silently resolves to nothing in light or in dark.
  2. A component references a token that does not exist — a typo that degrades
     to "no style" instead of to an error.
  3. A visual value is hard-coded in a component — or in an example, which
     claims to be built from the system and nothing else — instead of coming
     from a token, which is how a system stops being a single source of truth.
  4. dist/ drifts from the sources.

This script catches the first three; `build.py --check` covers the fourth.

    python3 tools/check.py
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "niveus"

DEFINITION = re.compile(r"(--[a-zA-Z0-9_-]+)\s*:")
REFERENCE = re.compile(r"var\(\s*(--[a-zA-Z0-9_-]+)")
COMMENT = re.compile(r"/\*.*?\*/", re.DOTALL)

# A raw color or a raw shadow geometry in a component means the design language
# was restated locally instead of referenced.
HARD_CODED = [
    (re.compile(r"#[0-9a-fA-F]{3,8}\b"), "hard-coded color"),
    (re.compile(r"\b(?:rgb|rgba|hsl|hsla|oklch|lab)\(", re.IGNORECASE), "hard-coded color"),
]

# Properties the *application* supplies per instance, not the system. A menu
# and its trigger have to name the same anchor, and only the markup knows which
# pair belongs together.
CONSUMER_DEFINED = {"--nv-anchor"}

TOKEN_FILES = sorted((SRC / "tokens").glob("*.css")) + sorted((SRC / "themes").glob("*.css"))
CONSUMER_FILES = (
    sorted((SRC / "components").glob("*.css"))
    + [SRC / "base.css", SRC / "utilities.css"]
)


def strip_comments(text: str) -> str:
    return COMMENT.sub("", text)


def collect(paths: list[Path]) -> tuple[set[str], dict[str, list[tuple[Path, int, str]]]]:
    """Return every custom property defined across `paths`, and every reference."""
    defined: set[str] = set()
    references: dict[str, list[tuple[Path, int, str]]] = {}

    for path in paths:
        source = strip_comments(path.read_text(encoding="utf-8"))
        for line_no, line in enumerate(source.split("\n"), start=1):
            for name in DEFINITION.findall(line):
                defined.add(name)
            for name in REFERENCE.findall(line):
                references.setdefault(name, []).append((path, line_no, line.strip()))

    return defined, references


def rel(path: Path) -> str:
    return str(path.relative_to(ROOT))


def check_theme_parity(failures: list[str]) -> None:
    light = SRC / "themes" / "light.css"
    dark = SRC / "themes" / "dark.css"

    light_roles = {
        name[len("--nv-light-") :]
        for name in DEFINITION.findall(strip_comments(light.read_text(encoding="utf-8")))
        if name.startswith("--nv-light-")
    }
    dark_roles = {
        name[len("--nv-dark-") :]
        for name in DEFINITION.findall(strip_comments(dark.read_text(encoding="utf-8")))
        if name.startswith("--nv-dark-")
    }

    for role in sorted(light_roles - dark_roles):
        failures.append(f"themes/dark.css: missing --nv-dark-{role} (light defines it)")
    for role in sorted(dark_roles - light_roles):
        failures.append(f"themes/light.css: missing --nv-light-{role} (dark defines it)")

    if not failures:
        print(f"  theme parity: {len(light_roles)} roles defined in both appearances")


def check_references(failures: list[str]) -> None:
    all_files = TOKEN_FILES + CONSUMER_FILES
    defined, references = collect(all_files)

    unresolved = []
    for name, sites in sorted(references.items()):
        if name.startswith("--_"):
            continue  # component-private, defined and used in the same rule
        if name in CONSUMER_DEFINED:
            continue
        if name in defined:
            continue
        # var() with a fallback is an intentional escape hatch.
        if all("," in line.split(f"var({name}")[1][:40] for _, _, line in sites):
            continue
        unresolved.append((name, sites[0]))

    for name, (path, line_no, _) in unresolved:
        failures.append(f"{rel(path)}:{line_no}: {name} is referenced but never defined")

    if not unresolved:
        print(f"  references: {len(references)} tokens referenced, all resolve")


def check_hard_coded(failures: list[str]) -> None:
    found = 0
    for path in CONSUMER_FILES:
        source = strip_comments(path.read_text(encoding="utf-8"))
        for line_no, line in enumerate(source.split("\n"), start=1):
            for pattern, label in HARD_CODED:
                if pattern.search(line):
                    failures.append(f"{rel(path)}:{line_no}: {label} — {line.strip()}")
                    found += 1

    if not found:
        print(f"  no hard-coded colors in {len(CONSUMER_FILES)} component and base files")


REFERENCE_DOC = ROOT / "REFERENCE.md"

EXAMPLES = ROOT / "examples"

# The one literal color an example is allowed: the input to the system.
BRAND_INPUT = re.compile(r"--nv-brand\s*:")

STYLE_BLOCK = re.compile(r"<style[^>]*>(.*?)</style>", re.DOTALL | re.IGNORECASE)
INLINE_STYLE = re.compile(r"""\sstyle=["']([^"']*)["']""")


def check_examples(failures: list[str]) -> None:
    """The examples claim to be built from the system and nothing else.

    That claim is only worth making if it is enforced: an example that quietly
    reaches for a hex value is no longer demonstrating the system, it is
    demonstrating how to work around one. The single exception is --nv-brand,
    which is the input the whole color system derives from — a literal there is
    the point.
    """
    if not EXAMPLES.is_dir():
        return

    scanned = 0
    for path in sorted(EXAMPLES.rglob("*")):
        if path.suffix not in {".css", ".html"}:
            continue
        scanned += 1
        raw = path.read_text(encoding="utf-8")

        if path.suffix == ".css":
            regions = [(1, strip_comments(raw))]
        else:
            # Only the parts of an HTML file that can carry style.
            regions = []
            for match in STYLE_BLOCK.finditer(raw):
                line = raw[: match.start()].count("\n") + 1
                regions.append((line, strip_comments(match.group(1))))
            for match in INLINE_STYLE.finditer(raw):
                line = raw[: match.start()].count("\n") + 1
                regions.append((line, match.group(1)))

        for base_line, region in regions:
            for offset, line in enumerate(region.split("\n")):
                if BRAND_INPUT.search(line):
                    continue
                for pattern, label in HARD_CODED:
                    if pattern.search(line):
                        failures.append(
                            f"{rel(path)}:{base_line + offset}: {label} in an example "
                            f"— {line.strip()[:70]}"
                        )

        if path.name == "index.html" and "dist/niveus.css" not in raw:
            failures.append(f"{rel(path)}: does not link the system stylesheet")

    if not failures:
        print(f"  examples: {scanned} files, no color stated outside --nv-brand")


def check_reference(failures: list[str]) -> None:
    """Every class the CSS defines must appear in REFERENCE.md, spelled in full.

    The reference claims to be the entire API — which is the only reason it is
    safe to hand to someone, or to a model, instead of the source. A class that
    exists but is undocumented breaks that claim silently, and a documented
    class that no longer exists is worse: it reads as real.
    """
    if not REFERENCE_DOC.is_file():
        return

    documented = REFERENCE_DOC.read_text(encoding="utf-8")

    defined: set[str] = set()
    sources = (
        sorted((SRC / "components").glob("*.css"))
        + [SRC / "utilities.css", SRC / "base.css", SRC / "continuity.css"]
    )
    for path in sources:
        source = strip_comments(path.read_text(encoding="utf-8"))
        defined.update(re.findall(r"\.(nv-[a-z0-9_-]+)", source))

    missing = sorted(name for name in defined if f".{name}" not in documented)
    for name in missing:
        failures.append(f"REFERENCE.md: .{name} is defined in the CSS but not documented")

    # And the reverse: nothing documented that no longer exists.
    mentioned = set(re.findall(r"`\.(nv-[a-z0-9_-]+)`", documented))
    for name in sorted(mentioned - defined):
        failures.append(f"REFERENCE.md: .{name} is documented but not defined anywhere")

    if not missing:
        print(f"  reference: {len(defined)} classes, all documented")


def main() -> int:
    failures: list[str] = []

    print("Niveus checks")
    check_theme_parity(failures)
    check_references(failures)
    check_hard_coded(failures)
    check_examples(failures)
    check_reference(failures)

    if failures:
        print(f"\n{len(failures)} problem(s):")
        for failure in failures:
            print(f"  {failure}")
        return 1

    print("\nAll checks passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
