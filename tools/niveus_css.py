"""Evaluate the subset of CSS that Niveus's token layer is written in.

Niveus derives its entire color system from one input with relative color
syntax, `color-mix()` and `calc()`. None of that survives a copy-paste into
another platform's resources (Android XML, a Qt header, GTK CSS), and
re-stating the results by hand would fork the system: the CSS would change and
the port would quietly keep the old values.

So this module implements the language instead, once, here — every port's
generator imports it rather than carrying its own copy.

It is deliberately narrow — it covers exactly what `niveus/tokens/*.css` and
`niveus/themes/*.css` use:

    #rrggbb / #rgb / #rrggbbaa      rgb(r g b / a)      transparent
    oklch(L C H)                    oklch(from <color> L C H [/ A])
    color-mix(in oklab, <a>, <b> <pct>)
    light-dark(<a>, <b>)            var(--x[, fallback])
    calc(...)  clamp(min,v,max)  min(...)  max(...)

Inside `oklch(from X ...)` the identifiers `l`, `c`, `h` and `alpha` are bound
to X's own OKLCH channels, which is what makes one brand value re-colour
everything.

Color math follows CSS Color 4: sRGB <-> linear sRGB <-> OKLab <-> OKLCH, and
out-of-gamut results are gamut-mapped by chroma reduction against deltaEOK,
the same approach browsers take. `color-mix()` mixes premultiplied, in OKLab.
"""

from __future__ import annotations

import math
import re
from dataclasses import dataclass

# ---------------------------------------------------------------------------
# Color space conversions (CSS Color 4)
# ---------------------------------------------------------------------------

def _srgb_to_linear(v: float) -> float:
    return v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4


def _linear_to_srgb(v: float) -> float:
    return v * 12.92 if v <= 0.0031308 else 1.055 * (v ** (1 / 2.4)) - 0.055


# linear sRGB -> LMS -> OKLab, per Björn Ottosson.
_LSRGB_TO_LMS = (
    (0.4122214708, 0.5363325363, 0.0514459929),
    (0.2119034982, 0.6806995451, 0.1073969566),
    (0.0883024619, 0.2817188376, 0.6299787005),
)
_LMS_TO_OKLAB = (
    (0.2104542553, 0.7936177850, -0.0040720468),
    (1.9779984951, -2.4285922050, 0.4505937099),
    (0.0259040371, 0.7827717662, -0.8086757660),
)
_OKLAB_TO_LMS = (
    (1.0, 0.3963377774, 0.2158037573),
    (1.0, -0.1055613458, -0.0638541728),
    (1.0, -0.0894841775, -1.2914855480),
)
_LMS_TO_LSRGB = (
    (4.0767416621, -3.3077115913, 0.2309699292),
    (-1.2684380046, 2.6097574011, -0.3413193965),
    (-0.0041960863, -0.7034186147, 1.7076147010),
)


def _mul(m, v):
    return tuple(sum(r[i] * v[i] for i in range(3)) for r in m)


def srgb_to_oklab(r: float, g: float, b: float) -> tuple[float, float, float]:
    lin = (_srgb_to_linear(r), _srgb_to_linear(g), _srgb_to_linear(b))
    lms = _mul(_LSRGB_TO_LMS, lin)
    lms_ = tuple(math.copysign(abs(x) ** (1 / 3), x) for x in lms)
    return _mul(_LMS_TO_OKLAB, lms_)


def oklab_to_srgb(L: float, a: float, b: float) -> tuple[float, float, float]:
    lms_ = _mul(_OKLAB_TO_LMS, (L, a, b))
    lms = tuple(x ** 3 for x in lms_)
    lin = _mul(_LMS_TO_LSRGB, lms)
    return tuple(_linear_to_srgb(x) for x in lin)


def oklab_to_oklch(L: float, a: float, b: float) -> tuple[float, float, float]:
    c = math.hypot(a, b)
    # Below this chroma the hue is meaningless; CSS treats it as `none`, and
    # carrying a garbage angle through a derivation produces garbage hues.
    h = 0.0 if c < 1e-6 else math.degrees(math.atan2(b, a)) % 360.0
    return (L, c, h)


def oklch_to_oklab(L: float, c: float, h: float) -> tuple[float, float, float]:
    rad = math.radians(h)
    return (L, c * math.cos(rad), c * math.sin(rad))


# ---------------------------------------------------------------------------
# CIELAB, for the Android system palette
# ---------------------------------------------------------------------------
#
# Niveus works in OKLab, but Android's tonal palette is defined in terms of
# *tone*, which is CIE L* — the same scale Material You's HCT uses for its T
# channel. Generating those ramps in OKLab lightness would put every tone at a
# slightly wrong luminance, so the palette gets its own, correct, colour space
# rather than an approximation.

# sRGB (D65) -> XYZ
_LRGB_TO_XYZ = (
    (0.4123907993, 0.3575843394, 0.1804807884),
    (0.2126390059, 0.7151686788, 0.0721923154),
    (0.0193308187, 0.1191947798, 0.9505321522),
)
_XYZ_TO_LRGB = (
    (3.2409699419, -1.5373831776, -0.4986107603),
    (-0.9692436363, 1.8759675015, 0.0415550574),
    (0.0556300797, -0.2039769589, 1.0569715142),
)
# D65 white point
_WHITE = (0.9504559271, 1.0, 1.0890577508)

_EPS = 216 / 24389
_KAPPA = 24389 / 27


def _f(t: float) -> float:
    return t ** (1 / 3) if t > _EPS else (_KAPPA * t + 16) / 116


def _f_inv(t: float) -> float:
    t3 = t ** 3
    return t3 if t3 > _EPS else (116 * t - 16) / _KAPPA


def srgb_to_lab(r: float, g: float, b: float) -> tuple[float, float, float]:
    """sRGB to CIE L*a*b*. L* is 0-100 and is what Android calls tone."""
    lin = (_srgb_to_linear(r), _srgb_to_linear(g), _srgb_to_linear(b))
    x, y, z = _mul(_LRGB_TO_XYZ, lin)
    fx, fy, fz = _f(x / _WHITE[0]), _f(y / _WHITE[1]), _f(z / _WHITE[2])
    return (116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz))


def lab_to_srgb(L: float, a: float, b: float) -> tuple[float, float, float]:
    fy = (L + 16) / 116
    fx = fy + a / 500
    fz = fy - b / 200
    xyz = (_f_inv(fx) * _WHITE[0], _f_inv(fy) * _WHITE[1], _f_inv(fz) * _WHITE[2])
    return tuple(_linear_to_srgb(v) for v in _mul(_XYZ_TO_LRGB, xyz))


def lch_to_srgb_clamped(L: float, C: float, H: float) -> tuple[float, float, float]:
    """A tone at a given hue and chroma, reduced until it fits sRGB.

    Tone is fixed — the whole point of a tonal palette is that tone 40 is the
    same lightness in every ramp — so chroma is what gives way, never L*.
    """
    rad = math.radians(H)
    lo, hi = 0.0, max(C, 0.0)
    best = lab_to_srgb(L, 0.0, 0.0)
    for _ in range(28):
        mid = (lo + hi) / 2
        candidate = lab_to_srgb(L, mid * math.cos(rad), mid * math.sin(rad))
        if all(-1e-4 <= v <= 1 + 1e-4 for v in candidate):
            best = candidate
            lo = mid
        else:
            hi = mid
    return tuple(min(1.0, max(0.0, v)) for v in best)


# ---------------------------------------------------------------------------
# Values
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class Num:
    value: float
    unit: str = ""

    def __repr__(self) -> str:  # pragma: no cover - debugging aid
        return f"Num({self.value}{self.unit})"


@dataclass(frozen=True)
class Color:
    """A color held in OKLab plus alpha. `none` means fully transparent."""

    L: float
    a: float
    b: float
    alpha: float = 1.0

    @staticmethod
    def from_srgb(r: float, g: float, bl: float, alpha: float = 1.0) -> "Color":
        L, a, b = srgb_to_oklab(r, g, bl)
        return Color(L, a, b, alpha)

    @property
    def oklch(self) -> tuple[float, float, float]:
        return oklab_to_oklch(self.L, self.a, self.b)

    def to_srgb(self) -> tuple[float, float, float]:
        return oklab_to_srgb(self.L, self.a, self.b)

    # -- gamut mapping ----------------------------------------------------
    def _in_gamut(self, eps: float = 1e-4) -> bool:
        return all(-eps <= x <= 1 + eps for x in self.to_srgb())

    def gamut_mapped(self) -> tuple[float, float, float]:
        """sRGB triple, chroma-reduced into gamut (CSS Color 4 §13.2)."""
        if self._in_gamut():
            return tuple(min(1.0, max(0.0, x)) for x in self.to_srgb())

        L, C, H = self.oklch
        if L >= 1.0:
            return (1.0, 1.0, 1.0)
        if L <= 0.0:
            return (0.0, 0.0, 0.0)

        lo, hi = 0.0, C
        clipped = None
        for _ in range(32):
            mid = (lo + hi) / 2
            candidate = Color(*oklch_to_oklab(L, mid, H), self.alpha)
            raw = candidate.to_srgb()
            if candidate._in_gamut():
                lo = mid
                clipped = tuple(min(1.0, max(0.0, x)) for x in raw)
                continue
            clip = tuple(min(1.0, max(0.0, x)) for x in raw)
            # deltaEOK between the candidate and its clipped form: once the
            # clip is imperceptible we accept it rather than desaturating more.
            cl = Color.from_srgb(*clip)
            if math.dist((candidate.L, candidate.a, candidate.b), (cl.L, cl.a, cl.b)) < 0.02:
                return clip
            hi = mid
        if clipped is not None:
            return clipped
        return tuple(min(1.0, max(0.0, x)) for x in self.to_srgb())

    # -- output -----------------------------------------------------------
    def hex8(self) -> str:
        """#AARRGGBB — Android's order."""
        r, g, b = self.gamut_mapped()
        a = min(1.0, max(0.0, self.alpha))
        return "#{:02X}{:02X}{:02X}{:02X}".format(
            round(a * 255), round(r * 255), round(g * 255), round(b * 255)
        )

    def hex_rgb(self) -> str:
        r, g, b = self.gamut_mapped()
        return "#{:02X}{:02X}{:02X}".format(round(r * 255), round(g * 255), round(b * 255))

    def argb_int(self) -> int:
        r, g, b = self.gamut_mapped()
        a = min(1.0, max(0.0, self.alpha))
        return (
            (round(a * 255) << 24)
            | (round(r * 255) << 16)
            | (round(g * 255) << 8)
            | round(b * 255)
        )

    def relative_luminance(self) -> float:
        r, g, b = self.gamut_mapped()
        lin = (_srgb_to_linear(r), _srgb_to_linear(g), _srgb_to_linear(b))
        return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2]


TRANSPARENT = Color(0.0, 0.0, 0.0, 0.0)


def contrast_ratio(fg: Color, bg: Color) -> float:
    """WCAG 2.1 contrast, compositing `fg` over `bg` if it is translucent."""
    if fg.alpha < 1.0:
        fr, fg_, fb = fg.gamut_mapped()
        br, bg_, bb = bg.gamut_mapped()
        a = fg.alpha
        fg = Color.from_srgb(
            fr * a + br * (1 - a), fg_ * a + bg_ * (1 - a), fb * a + bb * (1 - a)
        )
    l1, l2 = fg.relative_luminance(), bg.relative_luminance()
    if l1 < l2:
        l1, l2 = l2, l1
    return (l1 + 0.05) / (l2 + 0.05)


# ---------------------------------------------------------------------------
# Tokenizer / parser
# ---------------------------------------------------------------------------

_TOKEN = re.compile(
    r"""
      (?P<ws>\s+)
    | (?P<hex>\#[0-9a-fA-F]{3,8})
    | (?P<func>[a-zA-Z_][-a-zA-Z0-9_]*(?=\())
      # A leading `-` starts an identifier only when a digit does not follow,
      # or `-0.022em` would lex as the identifier `-0`.
    | (?P<ident>-{1,2}(?![0-9])[-a-zA-Z0-9_]+|[a-zA-Z_][-a-zA-Z0-9_]*)
    | (?P<num>[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?(?:%|[a-zA-Z]+)?)
    | (?P<punct>[(),/*+\-])
    """,
    re.VERBOSE,
)


def _lex(s: str) -> list[tuple[str, str]]:
    out: list[tuple[str, str]] = []
    i = 0
    while i < len(s):
        m = _TOKEN.match(s, i)
        if not m:
            raise ValueError(f"cannot lex at {s[i:i+30]!r} in {s!r}")
        i = m.end()
        kind = m.lastgroup
        if kind == "ws":
            continue
        out.append((kind, m.group()))
    return out


class _Parser:
    """Recursive descent over the component-value grammar Niveus uses."""

    def __init__(self, tokens: list[tuple[str, str]], ev: "Evaluator"):
        self.t = tokens
        self.i = 0
        self.ev = ev

    # -- plumbing ---------------------------------------------------------
    def peek(self) -> tuple[str, str] | None:
        return self.t[self.i] if self.i < len(self.t) else None

    def next(self) -> tuple[str, str]:
        tok = self.t[self.i]
        self.i += 1
        return tok

    def expect(self, text: str) -> None:
        tok = self.next()
        if tok[1] != text:
            raise ValueError(f"expected {text!r}, got {tok[1]!r}")

    def at(self, text: str) -> bool:
        tok = self.peek()
        return tok is not None and tok[1] == text

    def args(self) -> list[list[tuple[str, str]]]:
        """Consume `( a, b, c )` and return each argument's raw tokens."""
        self.expect("(")
        groups: list[list[tuple[str, str]]] = [[]]
        depth = 0
        while True:
            tok = self.peek()
            if tok is None:
                raise ValueError("unterminated (")
            if tok[1] == "(":
                depth += 1
            elif tok[1] == ")":
                if depth == 0:
                    self.next()
                    break
                depth -= 1
            elif tok[1] == "," and depth == 0:
                self.next()
                groups.append([])
                continue
            groups.append(groups.pop() + [self.next()])
        return [g for g in groups if g]

    # -- arithmetic -------------------------------------------------------
    def sum_(self) -> Num:
        left = self.product()
        while True:
            tok = self.peek()
            if tok is None:
                break
            if tok[1] in ("+", "-"):
                op = self.next()[1]
                left, right = _same_unit(left, self.product())
                unit = left.unit or right.unit
                left = Num(
                    left.value + right.value if op == "+" else left.value - right.value, unit
                )
                continue
            # `calc(l -0.045)` lexes the operand as one signed number, so the
            # sign has to be read back as the operator it was written as.
            if tok[0] == "num" and tok[1][0] in "+-":
                left, right = _same_unit(left, self.product())
                left = Num(left.value + right.value, left.unit or right.unit)
                continue
            break
        return left

    def product(self) -> Num:
        left = self.term()
        while self.peek() and self.peek()[1] in ("*", "/"):
            op = self.next()[1]
            right = self.term()
            unit = left.unit or right.unit
            if op == "*":
                left = Num(left.value * right.value, unit)
            else:
                left = Num(left.value / right.value, left.unit)
        return left

    def term(self) -> Num:
        tok = self.peek()
        if tok is None:
            raise ValueError("unexpected end of expression")
        if tok[1] == "(":
            self.next()
            v = self.sum_()
            self.expect(")")
            return v
        if tok[1] == "-":
            self.next()
            v = self.term()
            return Num(-v.value, v.unit)
        if tok[1] == "+":
            self.next()
            return self.term()
        val = self.value()
        if isinstance(val, Num):
            return val
        raise ValueError(f"expected a number, got {val!r}")

    # -- values -----------------------------------------------------------
    def value(self):
        tok = self.next()
        kind, text = tok

        if kind == "hex":
            return _parse_hex(text)

        if kind == "num":
            return _parse_num(text)

        if kind == "func":
            name = text.lower()
            if name == "calc":
                inner = self.args()
                return _Parser(inner[0], self.ev).sum_()
            if name in ("clamp", "min", "max"):
                vals = [_Parser(g, self.ev).sum_() for g in self.args()]
                if name == "clamp":
                    lo, v, hi = vals
                    unit = v.unit or lo.unit or hi.unit
                    return Num(min(max(v.value, lo.value), hi.value), unit)
                pick = min if name == "min" else max
                chosen = pick(vals, key=lambda n: n.value)
                return chosen
            if name == "var":
                groups = self.args()
                varname = "".join(t[1] for t in groups[0])
                fallback = groups[1] if len(groups) > 1 else None
                return self.ev.resolve(varname, fallback)
            if name == "rgb" or name == "rgba":
                return _parse_rgb(self.args(), self.ev)
            if name == "oklch":
                return _parse_oklch(self.args(), self.ev)
            if name == "oklab":
                return _parse_oklab(self.args(), self.ev)
            if name == "color-mix":
                return _parse_color_mix(self.args(), self.ev)
            if name == "light-dark":
                groups = self.args()
                pick = groups[0] if self.ev.appearance == "light" else groups[1]
                return _Parser(pick, self.ev).value()
            raise ValueError(f"unsupported function {name}()")

        if kind == "ident":
            low = text.lower()
            if low == "transparent":
                return TRANSPARENT
            if low in ("none", "currentcolor"):
                return TRANSPARENT
            if low in _NAMED:
                return _NAMED[low]
            if low in self.ev.bindings:
                return Num(self.ev.bindings[low])
            raise ValueError(f"unknown identifier {text!r}")

        raise ValueError(f"unexpected token {text!r}")


# The initial value of the root font size. Tokens never mix units, but
# component rules do (`calc(var(--_track-block) - 6px)` with a rem on one
# side), and adding the numbers without converting is silently wrong.
ROOT_FONT_SIZE_PX = 16.0


def _same_unit(a: Num, b: Num) -> tuple[Num, Num]:
    """Bring two lengths to a common unit before adding them."""
    if a.unit == b.unit or not a.unit or not b.unit:
        return a, b
    lengths = {"px": 1.0, "rem": ROOT_FONT_SIZE_PX, "em": ROOT_FONT_SIZE_PX}
    if a.unit in lengths and b.unit in lengths:
        return (Num(a.value * lengths[a.unit], "px"), Num(b.value * lengths[b.unit], "px"))
    raise ValueError(f"cannot add {a.unit} to {b.unit}")


_NAMED = {
    "white": Color.from_srgb(1, 1, 1),
    "black": Color.from_srgb(0, 0, 0),
}


def _parse_hex(text: str) -> Color:
    h = text[1:]
    if len(h) in (3, 4):
        h = "".join(ch * 2 for ch in h)
    if len(h) == 6:
        r, g, b = (int(h[i : i + 2], 16) / 255 for i in (0, 2, 4))
        return Color.from_srgb(r, g, b)
    if len(h) == 8:
        r, g, b, a = (int(h[i : i + 2], 16) / 255 for i in (0, 2, 4, 6))
        return Color.from_srgb(r, g, b, a)
    raise ValueError(f"bad hex color {text!r}")


def _parse_num(text: str) -> Num:
    m = re.fullmatch(r"([+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?)(%|[a-zA-Z]*)", text)
    if not m:
        raise ValueError(f"bad number {text!r}")
    v = float(m.group(1))
    unit = m.group(2)
    if unit == "%":
        return Num(v / 100.0, "%")
    return Num(v, unit)


def _flat(groups: list[list[tuple[str, str]]]) -> list[tuple[str, str]]:
    out: list[tuple[str, str]] = []
    for i, g in enumerate(groups):
        if i:
            out.append(("punct", ","))
        out.extend(g)
    return out


def _split_slash(tokens: list[tuple[str, str]]) -> tuple[list, list | None]:
    depth = 0
    for i, (_, text) in enumerate(tokens):
        if text == "(":
            depth += 1
        elif text == ")":
            depth -= 1
        elif text == "/" and depth == 0:
            return tokens[:i], tokens[i + 1 :]
    return tokens, None


def _components(tokens: list[tuple[str, str]], ev: "Evaluator", n: int) -> list[Num]:
    """Read `n` space-separated numeric components from a token run."""
    p = _Parser(tokens, ev)
    out: list[Num] = []
    for _ in range(n):
        out.append(p.sum_())
    return out


def _parse_rgb(groups, ev) -> Color:
    tokens = _flat(groups)
    # Both `rgb(r g b / a)` and the legacy `rgb(r, g, b, a)` appear in the wild.
    body, alpha_tokens = _split_slash(tokens)
    body = [t for t in body if t[1] != ","]
    nums = _components(body, ev, 3)
    vals = []
    for n in nums:
        vals.append(n.value if n.unit == "%" else n.value / 255.0)
    alpha = 1.0
    if alpha_tokens:
        alpha = _Parser(alpha_tokens, ev).sum_().value
    return Color.from_srgb(*vals, alpha)


def _oklch_channels(tokens, ev, base: Color | None):
    body, alpha_tokens = _split_slash(tokens)
    bindings = {}
    if base is not None:
        L, C, H = base.oklch
        bindings = {"l": L, "c": C, "h": H, "alpha": base.alpha}
    with ev.bound(bindings):
        nums = _components(body, ev, 3)
        alpha = base.alpha if base is not None else 1.0
        if alpha_tokens:
            alpha = _Parser(alpha_tokens, ev).sum_().value
    return nums, alpha


def _parse_oklch(groups, ev) -> Color:
    tokens = _flat(groups)
    base = None
    if tokens and tokens[0][0] == "ident" and tokens[0][1].lower() == "from":
        rest = tokens[1:]
        p = _Parser(rest, ev)
        base = p.value()
        if not isinstance(base, Color):
            raise ValueError("oklch(from …) needs a color")
        tokens = rest[p.i :]
    nums, alpha = _oklch_channels(tokens, ev, base)
    L, C, H = (n.value for n in nums)
    # A percentage lightness is 0–1; `oklch(50% …)` and `oklch(0.5 …)` agree.
    return Color(*oklch_to_oklab(L, C, H), alpha)


def _parse_oklab(groups, ev) -> Color:
    tokens = _flat(groups)
    base = None
    if tokens and tokens[0][0] == "ident" and tokens[0][1].lower() == "from":
        rest = tokens[1:]
        p = _Parser(rest, ev)
        base = p.value()
        tokens = rest[p.i :]
    body, alpha_tokens = _split_slash(tokens)
    bindings = {}
    if base is not None:
        bindings = {"l": base.L, "a": base.a, "b": base.b, "alpha": base.alpha}
    with ev.bound(bindings):
        nums = _components(body, ev, 3)
        alpha = base.alpha if base is not None else 1.0
        if alpha_tokens:
            alpha = _Parser(alpha_tokens, ev).sum_().value
    return Color(nums[0].value, nums[1].value, nums[2].value, alpha)


def _parse_color_mix(groups, ev) -> Color:
    # color-mix(in oklab, <a> [pct], <b> [pct])
    space_tokens = groups[0]
    space = " ".join(t[1] for t in space_tokens).replace("in ", "").strip()
    if space not in ("oklab", "oklch", "srgb"):
        raise ValueError(f"unsupported color-mix space {space!r}")

    parsed: list[tuple[Color, float | None]] = []
    for g in groups[1:3]:
        p = _Parser(g, ev)
        col = p.value()
        if not isinstance(col, Color):
            raise ValueError("color-mix needs colors")
        pct = None
        if p.peek() is not None:
            pct = p.sum_().value
        parsed.append((col, pct))

    (ca, pa), (cb, pb) = parsed
    if pa is None and pb is None:
        pa = pb = 0.5
    elif pa is None:
        pa = 1.0 - pb
    elif pb is None:
        pb = 1.0 - pa
    total = pa + pb
    if total == 0:
        raise ValueError("color-mix percentages sum to zero")
    pa, pb = pa / total, pb / total

    # CSS mixes premultiplied by alpha, then un-premultiplies.
    alpha = ca.alpha * pa + cb.alpha * pb
    if space == "srgb":
        ra, ga, ba = ca.gamut_mapped()
        rb, gb, bb = cb.gamut_mapped()
        comps = [
            (x * ca.alpha * pa + y * cb.alpha * pb) for x, y in ((ra, rb), (ga, gb), (ba, bb))
        ]
        if alpha > 0:
            comps = [x / alpha for x in comps]
        return Color.from_srgb(*comps, alpha)

    if space == "oklch":
        La, Ca, Ha = ca.oklch
        Lb, Cb, Hb = cb.oklch
        # shorter hue arc
        if abs(Hb - Ha) > 180:
            if Hb > Ha:
                Ha += 360
            else:
                Hb += 360
        L = La * ca.alpha * pa + Lb * cb.alpha * pb
        C = Ca * ca.alpha * pa + Cb * cb.alpha * pb
        H = Ha * ca.alpha * pa + Hb * cb.alpha * pb
        if alpha > 0:
            L, C, H = L / alpha, C / alpha, H / alpha
        return Color(*oklch_to_oklab(L, C, H % 360), alpha)

    L = ca.L * ca.alpha * pa + cb.L * cb.alpha * pb
    a = ca.a * ca.alpha * pa + cb.a * cb.alpha * pb
    b = ca.b * ca.alpha * pa + cb.b * cb.alpha * pb
    if alpha > 0:
        L, a, b = L / alpha, a / alpha, b / alpha
    return Color(L, a, b, alpha)


# ---------------------------------------------------------------------------
# Evaluator
# ---------------------------------------------------------------------------

class _Bound:
    def __init__(self, ev: "Evaluator", extra: dict):
        self.ev = ev
        self.extra = extra

    def __enter__(self):
        self.saved = self.ev.bindings
        self.ev.bindings = {**self.ev.bindings, **self.extra}

    def __exit__(self, *exc):
        self.ev.bindings = self.saved
        return False


class Evaluator:
    """Resolves `--nv-*` custom properties for one appearance."""

    def __init__(self, declarations: dict[str, str], appearance: str = "light"):
        self.declarations = declarations
        self.appearance = appearance
        self.bindings: dict[str, float] = {}
        self._cache: dict[tuple[str, str], object] = {}
        self._stack: list[str] = []

    def bound(self, extra: dict) -> _Bound:
        return _Bound(self, extra)

    def override(self, name: str, raw: str) -> None:
        self.declarations[name] = raw
        self._cache.clear()

    def resolve(self, name: str, fallback=None):
        key = (name, self.appearance)
        if key in self._cache:
            return self._cache[key]
        if name not in self.declarations:
            if fallback is not None:
                return _Parser(fallback, self).value()
            raise KeyError(f"undefined custom property {name}")
        if name in self._stack:
            raise ValueError(f"cyclic token reference: {' -> '.join(self._stack + [name])}")
        self._stack.append(name)
        # Bindings belong to the oklch(from …) that created them, not to a
        # token resolved from inside it.
        saved, self.bindings = self.bindings, {}
        try:
            value = self.eval(self.declarations[name])
        finally:
            self.bindings = saved
            self._stack.pop()
        self._cache[key] = value
        return value

    def eval(self, raw: str):
        return _Parser(_lex(raw.strip()), self).value()

    def color(self, name: str) -> Color:
        v = self.resolve(name)
        if not isinstance(v, Color):
            raise TypeError(f"{name} is not a color: {v!r}")
        return v


# ---------------------------------------------------------------------------
# Reading declarations out of the CSS
# ---------------------------------------------------------------------------

_COMMENT = re.compile(r"/\*.*?\*/", re.S)
_DECL = re.compile(r"(--[-a-zA-Z0-9_]+)\s*:\s*([^;}]+)")


def read_declarations(paths, skip_at_rules=True) -> dict[str, str]:
    """Collect every `--nv-*: value` declaration, last one winning.

    At-rule bodies (`@media (prefers-reduced-motion)`, `@supports not …`) are
    skipped: they are alternate appearances of a token, and baking a
    reduced-motion duration into the default build would be wrong.
    """
    out: dict[str, str] = {}
    for path in paths:
        with open(path, encoding="utf-8") as fh:
            css = _COMMENT.sub("", fh.read())
        if skip_at_rules:
            css = _strip_at_rules(css)
        for name, value in _DECL.findall(css):
            out[name] = " ".join(value.split())
    return out


def _strip_at_rules(css: str) -> str:
    out = []
    i = 0
    while i < len(css):
        at = css.find("@", i)
        if at == -1:
            out.append(css[i:])
            break
        out.append(css[i:at])
        # Skip to the matching close brace of the at-rule block.
        brace = css.find("{", at)
        if brace == -1:
            break
        depth = 0
        j = brace
        while j < len(css):
            if css[j] == "{":
                depth += 1
            elif css[j] == "}":
                depth -= 1
                if depth == 0:
                    break
            j += 1
        i = j + 1
    return "".join(out)


def read_at_rule_declarations(paths, condition: str) -> dict[str, str]:
    """Declarations from at-rule blocks whose prelude contains `condition`."""
    out: dict[str, str] = {}
    for path in paths:
        with open(path, encoding="utf-8") as fh:
            css = _COMMENT.sub("", fh.read())
        for prelude, body in _iter_at_rules(css):
            if condition in prelude:
                for name, value in _DECL.findall(body):
                    out[name] = " ".join(value.split())
    return out


def _iter_at_rules(css: str):
    i = 0
    while True:
        at = css.find("@", i)
        if at == -1:
            return
        brace = css.find("{", at)
        if brace == -1:
            return
        depth = 0
        j = brace
        while j < len(css):
            if css[j] == "{":
                depth += 1
            elif css[j] == "}":
                depth -= 1
                if depth == 0:
                    break
            j += 1
        yield css[at:brace], css[brace + 1 : j]
        i = j + 1


# ---------------------------------------------------------------------------
# Reading component rules
# ---------------------------------------------------------------------------
#
# The token layer is custom properties on :root, which read_declarations
# covers. A port that draws controls natively (a Qt style, Compose) also needs
# the component layer: which role a secondary button's background is, which
# shadow it gains on hover, what its disabled border becomes. Those live in
# ordinary rules in components/*.css, and restating them in a port would fork
# the system just as surely as restating a colour. So they are read here too.

def _split_selectors(prelude: str) -> list[str]:
    """`a, b:not(c, d)` -> [`a`, `b:not(c, d)`], whitespace collapsed."""
    out, depth, cur = [], 0, []
    for ch in prelude:
        if ch in "([":
            depth += 1
        elif ch in ")]":
            depth -= 1
        if ch == "," and depth == 0:
            out.append(" ".join("".join(cur).split()))
            cur = []
            continue
        cur.append(ch)
    tail = " ".join("".join(cur).split())
    if tail:
        out.append(tail)
    return out


def _parse_block_declarations(body: str) -> dict[str, str]:
    out: dict[str, str] = {}
    depth, cur = 0, []
    for ch in body + ";":
        if ch == "(":
            depth += 1
        elif ch == ")":
            depth -= 1
        if ch == ";" and depth == 0:
            decl = "".join(cur).strip()
            cur = []
            if ":" in decl:
                name, value = decl.split(":", 1)
                out[name.strip()] = " ".join(value.split())
            continue
        cur.append(ch)
    return out


def read_rules(paths, media: tuple[str, ...] = ("hover: hover",)) -> dict[str, dict[str, str]]:
    """Every style rule, as selector -> {property: value}, last one winning.

    A grouped selector (`a, b { … }`) is recorded under each of its members.
    Rules inside `@media` blocks whose condition contains one of `media` are
    read as if they were top level: `(hover: hover)` only says the device has a
    pointer, which a desktop always does. Every other at-rule is skipped;
    those are alternate states (reduced motion, missing features, entry
    animations) rather than the component's normal appearance.
    """
    rules: dict[str, dict[str, str]] = {}

    def walk(css: str) -> None:
        i = 0
        while True:
            brace = css.find("{", i)
            if brace == -1:
                return
            prelude = css[i:brace].strip()
            depth, j = 0, brace
            while j < len(css):
                if css[j] == "{":
                    depth += 1
                elif css[j] == "}":
                    depth -= 1
                    if depth == 0:
                        break
                j += 1
            body = css[brace + 1 : j]
            if prelude.startswith("@"):
                if prelude.startswith("@media") and any(m in prelude for m in media):
                    walk(body)
            else:
                decls = _parse_block_declarations(body)
                for sel in _split_selectors(prelude):
                    rules.setdefault(sel, {}).update(decls)
            i = j + 1

    for path in paths:
        with open(path, encoding="utf-8") as fh:
            walk(_COMMENT.sub("", fh.read()))
    return rules
