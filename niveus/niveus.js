/* ==========================================================================
   Niveus — continuity helpers
   --------------------------------------------------------------------------
   Optional. Nothing in Niveus needs this file to render; every component works
   without it. What it adds is continuity for the changes CSS cannot animate on
   its own — a selection moving to a different element, a panel replacing
   another, the whole surface changing appearance. All three are the same
   problem: two states that exist at different moments, with no single element
   transitioning between them. A view transition is the browser's answer, and
   this file is the small amount of wiring it needs.

   Everything here is a thin wrapper. An application that already owns its
   state (a router, a framework) should call nv.transition() around its own
   update and ignore the rest.

     nv.transition(update, { direction, kind, scope })  run an update continuously
     nv.setTheme("dark" | "light" | "system")    cross-fade the appearance
     nv.openDialog(dialog, trigger)              open it out of its trigger
     nv.selectTab(tablist, tab)                  move through the same surface

   Markup wiring, applied automatically on load:

     [data-nv-theme="dark"]        button that sets the appearance
     [data-nv-dialog="id"]         button that opens a dialog from itself
     [data-nv-tabs]                tablist whose [role=tab] children switch
                                   their aria-controls panels
     [data-nv-close]               button that closes its dialog or popover
     [data-nv-scroller]            frame whose [data-nv-scroll] controls move
                                   its .nv-scroller a page at a time
     .nv-reveal / .nv-reveal-group content that arrives as it scrolls into
                                   view, once (see continuity.css)
     .nv-card--spotlight           card whose light follows the pointer

   Only what changes is lifted. A transition names the selection marker and
   the items of the groups it is given as `scope`, and only for as long as it
   runs; everything else stays in the one page snapshot. Naming every item on
   the page permanently made every transition — a theme change included —
   tear the page into dozens of layers, which is both slow and what pulled
   items out from under frosted chrome.

   Reduced motion is honoured by skipping the view transition entirely: the
   update still runs, it simply arrives instead of travelling.
   ========================================================================== */

(function (global) {
  "use strict";

  var root = document.documentElement;

  function prefersReducedMotion() {
    return global.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function canTransition() {
    return typeof document.startViewTransition === "function" && !prefersReducedMotion();
  }

  /**
   * Run `update` so the user can follow the change.
   * `direction` ("forward" | "backward") tells content which way to travel;
   * `kind` ("theme") marks a change the whole surface takes part in;
   * `scope` (an element or a list of them) names the selection groups whose
   * marker should travel. Without a scope, nothing is lifted and the change
   * cross-fades in place.
   */
  function transition(update, options) {
    options = options || {};

    if (!canTransition()) {
      return Promise.resolve(update());
    }

    if (options.direction) root.dataset.nvDirection = options.direction;
    if (options.kind) root.dataset.nvTransition = options.kind;

    var groups = [].concat(options.scope || []).filter(Boolean);
    var lifted = [];
    groups.forEach(function (group) {
      group.setAttribute("data-nv-travelling", "");
      lifted = lifted.concat(liftLabels(group));
    });

    var view = document.startViewTransition(update);

    function clear() {
      delete root.dataset.nvDirection;
      delete root.dataset.nvTransition;
      groups.forEach(function (group) { group.removeAttribute("data-nv-travelling"); });
      lifted.forEach(function (item) { item.style.viewTransitionName = ""; });
    }
    view.finished.then(clear, clear);

    return view.finished;
  }

  /** "light" | "dark" | "system" — system means: follow the environment. */
  function setTheme(theme) {
    var done = transition(function () {
      if (theme === "system") {
        root.removeAttribute("data-theme");
      } else {
        root.setAttribute("data-theme", theme);
      }
      syncThemeControls(theme);
    }, { kind: "theme" });

    root.dispatchEvent(new CustomEvent("nv:theme", { detail: { theme: theme } }));
    return done;
  }

  function syncThemeControls(theme) {
    var controls = document.querySelectorAll("[data-nv-theme]");
    for (var i = 0; i < controls.length; i++) {
      controls[i].setAttribute("aria-pressed", String(controls[i].dataset.nvTheme === theme));
    }
  }

  /**
   * Open a <dialog> so it appears to come from `trigger`: the entrance scales
   * away from the trigger's centre instead of from the middle of the screen.
   */
  function openDialog(dialog, trigger) {
    if (typeof dialog === "string") dialog = document.getElementById(dialog);
    if (!dialog) return null;

    dialog.showModal();

    if (trigger) {
      // showModal() has already laid the dialog out, so both boxes are final.
      var from = trigger.getBoundingClientRect();
      var to = dialog.getBoundingClientRect();

      // A trigger far outside the viewport — one the page has scrolled past —
      // would otherwise put the origin hundreds of pixels away and turn a
      // 3% scale into a lunge across the screen. One dialog-length in any
      // direction is enough to say where it came from.
      var clamp = function (value, size) {
        return Math.max(-size, Math.min(value, size * 2));
      };

      dialog.style.setProperty(
        "--nv-origin",
        clamp(from.left + from.width / 2 - to.left, to.width).toFixed(1) + "px " +
        clamp(from.top + from.height / 2 - to.top, to.height).toFixed(1) + "px"
      );
    } else {
      dialog.style.removeProperty("--nv-origin");
    }

    return dialog;
  }

  function tabsOf(tablist) {
    return Array.prototype.slice.call(tablist.querySelectorAll('[role="tab"]'));
  }

  /** Move the selection, and the panel, in the direction the user is going. */
  function selectTab(tablist, tab) {
    var tabs = tabsOf(tablist);
    var next = tabs.indexOf(tab);
    var current = -1;

    for (var i = 0; i < tabs.length; i++) {
      if (tabs[i].getAttribute("aria-selected") === "true") current = i;
    }
    if (next < 0 || next === current) return Promise.resolve();

    // The outgoing and incoming panels carry one name between them — the old
    // one in the old state, the new one in the new — so the browser treats
    // them as one surface whose content changes. Named only for the length of
    // the change, so any number of tab sets can live on one page.
    var panelOf = function (candidate) {
      return candidate ? document.getElementById(candidate.getAttribute("aria-controls")) : null;
    };
    var outgoing = panelOf(tabs[current]);
    var incoming = panelOf(tab);
    if (outgoing && canTransition()) outgoing.style.viewTransitionName = "nv-panel";

    var done = transition(function () {
      tabs.forEach(function (candidate, index) {
        var selected = index === next;
        candidate.setAttribute("aria-selected", String(selected));
        candidate.tabIndex = selected ? 0 : -1;

        var panel = panelOf(candidate);
        if (panel) panel.hidden = !selected;
      });
      if (outgoing) outgoing.style.viewTransitionName = "";
      if (incoming && canTransition()) incoming.style.viewTransitionName = "nv-panel";
    }, { direction: next > current ? "forward" : "backward", scope: tablist });

    var settle = function () { if (incoming) incoming.style.viewTransitionName = ""; };
    done.then(settle, settle);

    tab.focus();
    return done;
  }

  function initTabs(tablist) {
    tablist.addEventListener("click", function (event) {
      var tab = event.target.closest('[role="tab"]');
      if (tab && tablist.contains(tab)) {
        event.preventDefault();
        selectTab(tablist, tab);
      }
    });

    // The ARIA tabs pattern: arrows move selection, Home and End jump to the
    // ends, and only the selected tab is in the tab order.
    tablist.addEventListener("keydown", function (event) {
      var tabs = tabsOf(tablist);
      var index = tabs.indexOf(document.activeElement);
      if (index < 0) return;

      var vertical = tablist.getAttribute("aria-orientation") === "vertical";
      var back = vertical ? "ArrowUp" : "ArrowLeft";
      var forward = vertical ? "ArrowDown" : "ArrowRight";
      var target = null;

      if (event.key === back) target = tabs[(index - 1 + tabs.length) % tabs.length];
      else if (event.key === forward) target = tabs[(index + 1) % tabs.length];
      else if (event.key === "Home") target = tabs[0];
      else if (event.key === "End") target = tabs[tabs.length - 1];

      if (target) {
        event.preventDefault();
        selectTab(tablist, target);
      }
    });
  }

  /**
   * Wire a scroller's prev/next controls. Scrolling itself is the browser's;
   * this only gives pointers without a horizontal axis somewhere to click, and
   * hides a control once there is nothing left in that direction.
   */
  function initScroller(frame) {
    var track = frame.querySelector(".nv-scroller");
    if (!track) return;

    var controls = frame.querySelectorAll("[data-nv-scroll]");

    function step() {
      var item = track.firstElementChild;
      if (!item) return track.clientWidth * 0.8;
      var gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      return item.getBoundingClientRect().width + gap;
    }

    function update() {
      // A sub-pixel slack, or a fractional scrollWidth leaves a control
      // enabled at an end it cannot move past.
      var atStart = track.scrollLeft <= 1;
      var atEnd = track.scrollLeft >= track.scrollWidth - track.clientWidth - 1;

      controls.forEach(function (control) {
        control.disabled = control.dataset.nvScroll === "prev" ? atStart : atEnd;
      });

      // The same two facts decide which edge is allowed to fade.
      frame.toggleAttribute("data-nv-at-start", atStart);
      frame.toggleAttribute("data-nv-at-end", atEnd);
    }

    controls.forEach(function (control) {
      control.addEventListener("click", function () {
        var direction = control.dataset.nvScroll === "next" ? 1 : -1;
        track.scrollBy({ left: direction * step(), behavior: "smooth" });
      });
    });

    track.addEventListener("scroll", update, { passive: true });
    if (typeof ResizeObserver === "function") new ResizeObserver(update).observe(track);
    update();
  }

  /**
   * Give every item in `scope` a view-transition name, so it is captured as
   * its own layer and rides *above* the travelling marker instead of being
   * painted over by it. Returns the items it named, so the caller can take
   * the names back off; transition() does this for its `scope` and clears
   * them when the change is over.
   *
   * This cannot live in CSS: a view-transition-name must be unique across the
   * whole document, and a stylesheet cannot count items. Items already
   * carrying a name are left alone, so an application can assign its own.
   */
  var carried = 0;

  function liftLabels(scope) {
    var items = scope.querySelectorAll(".nv-nav__item");
    var named = [];

    for (var j = 0; j < items.length; j++) {
      if (items[j].style.viewTransitionName) continue;
      carried += 1;
      items[j].style.viewTransitionName = "nv-carried-" + carried;
      named.push(items[j]);
    }
    return named;
  }

  /**
   * Reveal content as it scrolls into view. Elements are only marked as
   * waiting here, so a page without this script — or under reduced motion —
   * never hides anything. Each element arrives once and is then left alone.
   */
  var revealer = null;

  function arrive(target) {
    var items = target.classList.contains("nv-reveal-group") ? target.children : [target];
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      item.style.setProperty("--nv-reveal-index", String(i));
      item.dataset.nvReveal = "shown";
      item.addEventListener("animationend", function settle(event) {
        if (event.target !== this || event.animationName !== "nv-arrive") return;
        this.removeEventListener("animationend", settle);
        delete this.dataset.nvReveal;
        this.style.removeProperty("--nv-reveal-index");
      });
    }
  }

  function initReveal(scope) {
    if (prefersReducedMotion() || typeof global.IntersectionObserver !== "function") return;

    revealer = revealer || new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        revealer.unobserve(entry.target);
        arrive(entry.target);
      });
    }, { rootMargin: "0px 0px -8% 0px" });

    scope.querySelectorAll(".nv-reveal, .nv-reveal-group").forEach(function (target) {
      if (target.dataset.nvRevealWired) return;
      target.dataset.nvRevealWired = "";
      var items = target.classList.contains("nv-reveal-group") ? target.children : [target];
      for (var i = 0; i < items.length; i++) items[i].dataset.nvReveal = "pending";
      revealer.observe(target);
    });
  }

  /**
   * The light on a .nv-card--spotlight sits under the pointer. One listener
   * for the whole document, so cards added later need no wiring.
   */
  function trackSpotlight(event) {
    if (event.pointerType && event.pointerType !== "mouse") return;
    var surface = event.target.closest && event.target.closest(".nv-card--spotlight");
    if (!surface) return;
    var box = surface.getBoundingClientRect();
    surface.style.setProperty("--nv-pointer-x", event.clientX - box.left + "px");
    surface.style.setProperty("--nv-pointer-y", event.clientY - box.top + "px");
  }

  /**
   * The light on a .nv-material-glaze follows the pointer. One listener for
   * the document and one write per frame, so a page of glass costs the same as
   * a page of one pane. Each surface is told where the pointer is relative to
   * itself (--nv-light-x/-y) and which way it lies (--nv-light-angle, the CSS
   * gradient angle that puts the bright end of the rim on that side).
   * Touch and reduced motion leave the default light from the top left.
   */
  var lightFrame = 0;
  var lightX = 0;
  var lightY = 0;

  function applyLight() {
    lightFrame = 0;
    var surfaces = document.querySelectorAll(".nv-material-glaze");
    for (var i = 0; i < surfaces.length; i++) {
      var surface = surfaces[i];
      var box = surface.getBoundingClientRect();
      if (box.bottom < 0 || box.top > global.innerHeight) continue;
      var x = lightX - box.left;
      var y = lightY - box.top;
      var angle = Math.atan2(box.left + box.width / 2 - lightX, lightY - (box.top + box.height / 2));
      surface.style.setProperty("--nv-light-x", x.toFixed(1) + "px");
      surface.style.setProperty("--nv-light-y", y.toFixed(1) + "px");
      surface.style.setProperty("--nv-light-angle", (angle * 180 / Math.PI).toFixed(1) + "deg");
    }
  }

  function trackLight(event) {
    if (event.pointerType && event.pointerType === "touch") return;
    if (prefersReducedMotion()) return;
    lightX = event.clientX;
    lightY = event.clientY;
    if (!lightFrame) lightFrame = global.requestAnimationFrame(applyLight);
  }

  /**
   * A .nv-slider keeps its fill in step with its value, and, with data-nv-var,
   * writes that value into a CSS custom property: on :root by default, or on
   * the element data-nv-var-target selects. The property is the source of
   * truth, so the slider starts where the stylesheet already is.
   */
  function initSlider(slider) {
    if (slider.dataset.nvSliderWired) return;
    slider.dataset.nvSliderWired = "";

    var name = slider.dataset.nvVar;
    var target = document.documentElement;
    if (name && slider.dataset.nvVarTarget) {
      target = document.querySelector(slider.dataset.nvVarTarget) || target;
    }

    function fill() {
      var min = parseFloat(slider.min || "0");
      var max = parseFloat(slider.max || "100");
      var fraction = max > min ? (parseFloat(slider.value) - min) / (max - min) : 0;
      // The fill ends under the middle of the thumb, which travels one thumb
      // width less than the track.
      slider.style.setProperty(
        "--nv-slider-pos",
        "calc(" + (fraction * 100).toFixed(2) + "% + " + (0.5 - fraction).toFixed(3) + " * var(--_thumb))"
      );
    }

    if (name) {
      var current = parseFloat(getComputedStyle(target).getPropertyValue(name));
      if (!isNaN(current)) slider.value = current;
    }
    fill();

    slider.addEventListener("input", function () {
      fill();
      if (name) target.style.setProperty(name, slider.value);
    });
  }

  /* ------------------------------------------------------------------------
     Calendar
     ------------------------------------------------------------------------ */

  function pad(n) {
    return (n < 10 ? "0" : "") + n;
  }

  function isoDate(date) {
    return date.getFullYear() + "-" + pad(date.getMonth() + 1) + "-" + pad(date.getDate());
  }

  function parseDate(text) {
    var match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text || "");
    return match ? new Date(+match[1], +match[2] - 1, +match[3]) : null;
  }

  function weekStart(locale) {
    try {
      var info = new Intl.Locale(locale || navigator.language);
      var week = info.getWeekInfo ? info.getWeekInfo() : info.weekInfo;
      if (week && week.firstDay) return week.firstDay % 7;
    } catch (error) { /* fall through to Monday */ }
    return 1;
  }

  /**
   * Builds and drives one .nv-calendar. Configuration is data-*: nv-value
   * (YYYY-MM-DD), nv-min, nv-max, nv-locale, nv-week-start (0 = Sunday).
   * Choosing a day sets data-nv-value and fires `nv:date` with
   * { value, date }. Stepping months travels as a view transition.
   */
  function initCalendar(calendar) {
    if (calendar.dataset.nvCalendarWired) return;
    calendar.dataset.nvCalendarWired = "";

    var locale = calendar.dataset.nvLocale || document.documentElement.lang || undefined;
    var now = new Date();
    var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var selected = parseDate(calendar.dataset.nvValue);
    var min = parseDate(calendar.dataset.nvMin);
    var max = parseDate(calendar.dataset.nvMax);
    var first = calendar.dataset.nvWeekStart !== undefined
      ? parseInt(calendar.dataset.nvWeekStart, 10) % 7
      : weekStart(locale);
    var active = selected || today;
    var view = new Date(active.getFullYear(), active.getMonth(), 1);

    var title = calendar.querySelector(".nv-calendar__title");
    var grid = calendar.querySelector(".nv-calendar__grid");
    if (!grid) {
      grid = document.createElement("div");
      grid.className = "nv-calendar__grid";
      grid.setAttribute("role", "grid");
      calendar.appendChild(grid);
    }
    if (title) {
      if (!title.id) title.id = "nv-calendar-" + Math.random().toString(36).slice(2, 8);
      grid.setAttribute("aria-labelledby", title.id);
    }

    function render() {
      if (title) title.textContent = view.toLocaleDateString(locale, { month: "long", year: "numeric" });
      grid.textContent = "";

      var head = document.createElement("div");
      head.setAttribute("role", "row");
      for (var d = 0; d < 7; d++) {
        var name = document.createElement("span");
        name.className = "nv-calendar__weekday";
        name.setAttribute("role", "columnheader");
        // 2023-01-01 was a Sunday.
        name.textContent = new Date(2023, 0, 1 + ((first + d) % 7))
          .toLocaleDateString(locale, { weekday: "short" });
        head.appendChild(name);
      }
      grid.appendChild(head);

      var offset = (view.getDay() - first + 7) % 7;
      var cursor = new Date(view.getFullYear(), view.getMonth(), 1 - offset);
      var activeIso = isoDate(active);
      var selectedIso = selected ? isoDate(selected) : "";
      var todayIso = isoDate(today);
      var row;

      // Six weeks every month, so the calendar never changes height.
      for (var i = 0; i < 42; i++) {
        if (i % 7 === 0) {
          row = document.createElement("div");
          row.setAttribute("role", "row");
          grid.appendChild(row);
        }
        var iso = isoDate(cursor);
        var day = document.createElement("button");
        day.type = "button";
        day.className = "nv-calendar__day";
        day.setAttribute("role", "gridcell");
        day.dataset.date = iso;
        day.textContent = cursor.getDate();
        day.setAttribute("aria-label", cursor.toLocaleDateString(locale, { dateStyle: "full" }));
        day.tabIndex = iso === activeIso ? 0 : -1;
        if (cursor.getMonth() !== view.getMonth()) day.dataset.outside = "";
        if (iso === todayIso) day.setAttribute("aria-current", "date");
        if (iso === selectedIso) day.setAttribute("aria-selected", "true");
        if ((min && cursor < min) || (max && cursor > max)) day.disabled = true;
        row.appendChild(day);
        cursor.setDate(cursor.getDate() + 1);
      }

      // The active day may sit outside this month's grid after a step.
      if (!grid.querySelector('[tabindex="0"]')) {
        var anchor = grid.querySelector(".nv-calendar__day:not([data-outside]):not(:disabled)");
        if (anchor) anchor.tabIndex = 0;
      }
    }

    function focusActive() {
      var button = grid.querySelector('[data-date="' + isoDate(active) + '"]');
      if (button) button.focus();
    }

    function show(date, direction, focus) {
      var monthChanged = date.getFullYear() !== view.getFullYear() || date.getMonth() !== view.getMonth();
      active = date;
      var update = function () {
        view = new Date(date.getFullYear(), date.getMonth(), 1);
        render();
        if (focus) focusActive();
      };
      if (monthChanged) transition(update, { direction: direction });
      else update();
    }

    function stepMonth(count) {
      var target = new Date(view.getFullYear(), view.getMonth() + count, 1);
      var last = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
      target.setDate(Math.min(active.getDate(), last));
      show(target, count > 0 ? "forward" : "backward", false);
    }

    function choose(button) {
      selected = parseDate(button.dataset.date);
      active = selected;
      calendar.dataset.nvValue = button.dataset.date;
      if (button.dataset.outside !== undefined) {
        show(selected, selected > view ? "forward" : "backward", true);
      } else {
        grid.querySelectorAll('[aria-selected="true"]').forEach(function (other) {
          other.removeAttribute("aria-selected");
        });
        button.setAttribute("aria-selected", "true");
      }
      calendar.dispatchEvent(new CustomEvent("nv:date", {
        bubbles: true,
        detail: { value: button.dataset.date, date: selected },
      }));
    }

    calendar.addEventListener("click", function (event) {
      var step = event.target.closest("[data-nv-calendar-step]");
      if (step && calendar.contains(step)) {
        stepMonth(parseInt(step.dataset.nvCalendarStep, 10));
        return;
      }
      var day = event.target.closest(".nv-calendar__day");
      if (day && !day.disabled) choose(day);
    });

    grid.addEventListener("keydown", function (event) {
      var day = event.target.closest(".nv-calendar__day");
      if (!day) return;
      var rtl = getComputedStyle(calendar).direction === "rtl";
      var from = parseDate(day.dataset.date);
      var to = new Date(from.getFullYear(), from.getMonth(), from.getDate());
      switch (event.key) {
        case "ArrowLeft": to.setDate(to.getDate() + (rtl ? 1 : -1)); break;
        case "ArrowRight": to.setDate(to.getDate() + (rtl ? -1 : 1)); break;
        case "ArrowUp": to.setDate(to.getDate() - 7); break;
        case "ArrowDown": to.setDate(to.getDate() + 7); break;
        case "Home": to.setDate(to.getDate() - ((to.getDay() - first + 7) % 7)); break;
        case "End": to.setDate(to.getDate() + 6 - ((to.getDay() - first + 7) % 7)); break;
        case "PageUp": to.setMonth(to.getMonth() - (event.shiftKey ? 12 : 1)); break;
        case "PageDown": to.setMonth(to.getMonth() + (event.shiftKey ? 12 : 1)); break;
        default: return;
      }
      event.preventDefault();
      if ((min && to < min) || (max && to > max)) return;
      show(to, to > from ? "forward" : "backward", true);
    });

    render();
  }

  /* ------------------------------------------------------------------------
     Time picker
     ------------------------------------------------------------------------ */

  /**
   * Builds and drives one .nv-timepicker from data-*: nv-value (HH:MM, 24h),
   * nv-hours ("24", the default, or "12" for an AM/PM wheel), nv-step (minute
   * interval), nv-name (adds a hidden input for forms) and nv-format-toggle
   * (adds a 24H / AM/PM switch under the wheels). The value is always 24-hour,
   * whatever the wheels show. Fires `nv:time` with { value } as the wheels
   * settle on a new row.
   */
  function initTimePicker(picker) {
    if (picker.dataset.nvTimeWired) return;
    picker.dataset.nvTimeWired = "";

    var twelve = picker.dataset.nvHours === "12";
    var step = Math.max(1, parseInt(picker.dataset.nvStep || "1", 10));
    var now = new Date();
    var match = /^(\d{1,2}):(\d{2})$/.exec(picker.dataset.nvValue || "");
    var h24 = match ? parseInt(match[1], 10) % 24 : now.getHours();
    var minute = match ? parseInt(match[2], 10) % 60 : now.getMinutes();

    var minuteItems = [];
    for (var m = 0; m < 60; m += step) minuteItems.push(pad(m));

    var wheels = document.createElement("div");
    wheels.className = "nv-timepicker__wheels";
    var hourColumn, minuteColumn, periodColumn;
    var field = null;
    var formatButtons = [];
    var placed = false;
    var last = "";
    var frame = 0;

    function indexOf(column) {
      var row = column.firstElementChild ? column.firstElementChild.offsetHeight : 0;
      if (!row) return -1;
      return Math.max(0, Math.min(column.children.length - 1, Math.round(column.scrollTop / row)));
    }

    function scrollTo(column, index, smooth) {
      var row = column.firstElementChild.offsetHeight;
      column.scrollTo({ top: index * row, behavior: smooth && !prefersReducedMotion() ? "smooth" : "auto" });
    }

    function mark(column, index) {
      for (var i = 0; i < column.children.length; i++) {
        column.children[i].setAttribute("aria-selected", i === index ? "true" : "false");
      }
    }

    function read() {
      var hi = indexOf(hourColumn);
      var mi = indexOf(minuteColumn);
      if (hi < 0 || mi < 0) return;
      var pm = periodColumn ? indexOf(periodColumn) === 1 : false;
      mark(hourColumn, hi);
      mark(minuteColumn, mi);
      if (periodColumn) mark(periodColumn, pm ? 1 : 0);

      var hour = twelve ? ((hi + 1) % 12) + (pm ? 12 : 0) : hi;
      var value = pad(hour) + ":" + minuteItems[mi];
      if (value === last) return;
      last = value;
      // place() replays these when the picker is shown again, so they must
      // follow the wheels rather than stay at what it was built with.
      h24 = hour;
      minute = parseInt(minuteItems[mi], 10);
      picker.dataset.nvValue = value;
      if (field) field.value = value;
      picker.dispatchEvent(new CustomEvent("nv:time", { bubbles: true, detail: { value: value } }));
    }

    // Puts the wheels where the value says. Needs layout, so it runs when the
    // picker becomes visible, not when it is built (it may sit in a closed
    // popover).
    function place() {
      if (!hourColumn.firstElementChild || !hourColumn.firstElementChild.offsetHeight) return;
      placed = true;
      var hi = twelve ? ((h24 % 12) || 12) - 1 : h24;
      var mi = Math.round(minute / step) % minuteItems.length;
      scrollTo(hourColumn, hi, false);
      scrollTo(minuteColumn, mi, false);
      if (periodColumn) scrollTo(periodColumn, h24 >= 12 ? 1 : 0, false);
      read();
    }

    function buildColumn(label, items) {
      var list = document.createElement("ul");
      list.className = "nv-timepicker__column";
      list.setAttribute("role", "listbox");
      list.setAttribute("aria-label", label);
      list.tabIndex = 0;
      items.forEach(function (text) {
        var option = document.createElement("li");
        option.className = "nv-timepicker__option";
        option.setAttribute("role", "option");
        option.textContent = text;
        list.appendChild(option);
      });

      list.addEventListener("scroll", function () {
        if (frame) return;
        frame = global.requestAnimationFrame(function () { frame = 0; read(); });
      }, { passive: true });

      list.addEventListener("click", function (event) {
        var option = event.target.closest(".nv-timepicker__option");
        if (option) scrollTo(list, Array.prototype.indexOf.call(list.children, option), true);
      });

      list.addEventListener("keydown", function (event) {
        var index = indexOf(list);
        var end = list.children.length - 1;
        var to;
        switch (event.key) {
          case "ArrowUp": to = index - 1; break;
          case "ArrowDown": to = index + 1; break;
          case "PageUp": to = index - 5; break;
          case "PageDown": to = index + 5; break;
          case "Home": to = 0; break;
          case "End": to = end; break;
          default: return;
        }
        event.preventDefault();
        scrollTo(list, Math.max(0, Math.min(end, to)), true);
      });
      return list;
    }

    function colon() {
      var mark = document.createElement("span");
      mark.className = "nv-timepicker__separator";
      mark.setAttribute("aria-hidden", "true");
      mark.textContent = ":";
      return mark;
    }

    // The wheels depend on the format, so a change of format rebuilds them and
    // lands on the same moment in the new layout.
    function build() {
      var hourItems = [];
      var count = twelve ? 12 : 24;
      for (var h = 0; h < count; h++) hourItems.push(twelve ? String(h + 1) : pad(h));

      wheels.textContent = "";
      hourColumn = buildColumn("Hours", hourItems);
      minuteColumn = buildColumn("Minutes", minuteItems);
      periodColumn = twelve ? buildColumn("AM or PM", ["AM", "PM"]) : null;
      wheels.appendChild(hourColumn);
      wheels.appendChild(colon());
      wheels.appendChild(minuteColumn);
      if (periodColumn) wheels.appendChild(periodColumn);

      formatButtons.forEach(function (button) {
        button.setAttribute("aria-pressed", String((button.dataset.hours === "12") === twelve));
      });
      placed = false;
      place();
    }

    picker.textContent = "";
    picker.setAttribute("role", "group");
    if (!picker.hasAttribute("aria-label") && !picker.hasAttribute("aria-labelledby")) {
      picker.setAttribute("aria-label", "Time");
    }
    picker.appendChild(wheels);

    if (picker.hasAttribute("data-nv-format-toggle")) {
      var format = document.createElement("div");
      format.className = "nv-timepicker__format nv-button-group";
      format.setAttribute("role", "group");
      format.setAttribute("aria-label", "Time format");
      [["24", "24H"], ["12", "AM/PM"]].forEach(function (option) {
        var button = document.createElement("button");
        button.type = "button";
        button.className = "nv-button nv-button--sm";
        button.dataset.hours = option[0];
        button.textContent = option[1];
        button.addEventListener("click", function () {
          var wants = option[0] === "12";
          if (wants === twelve) return;
          twelve = wants;
          picker.dataset.nvHours = option[0];
          build();
        });
        formatButtons.push(button);
        format.appendChild(button);
      });
      picker.appendChild(format);
    }

    if (picker.dataset.nvName) {
      field = document.createElement("input");
      field.type = "hidden";
      field.name = picker.dataset.nvName;
      picker.appendChild(field);
    }

    build();

    if (typeof global.IntersectionObserver === "function") {
      // A hidden element loses its scroll offsets, so the wheels are put back
      // each time the picker reappears — and only then, never while it is on
      // screen and being turned.
      var seen = new global.IntersectionObserver(function (entries) {
        var visible = entries.some(function (entry) { return entry.isIntersecting; });
        if (!visible) placed = false;
        else if (!placed) place();
      });
      seen.observe(picker);
    }
  }

  /* ------------------------------------------------------------------------
     Popup list
     ------------------------------------------------------------------------ */

  /**
   * Gives a .nv-menu--listbox the behaviour of a native select: arrows,
   * Home/End, type-ahead, Enter/Space to choose, and filtering when it holds a
   * .nv-menu__search. The trigger is the element whose popovertarget is the
   * list's id; it receives `nv:select` with { value, label } and keeps the
   * choice in data-nv-value.
   */
  function initListbox(list) {
    if (list.dataset.nvListWired || !list.id) return;
    list.dataset.nvListWired = "";

    var trigger = document.querySelector('[popovertarget="' + list.id + '"]');
    var label = trigger && (trigger.querySelector("[data-nv-picker-label]") || trigger);
    var search = list.querySelector(".nv-menu__search");
    var buffer = "";
    var bufferTimer = 0;

    function options() {
      return Array.prototype.filter.call(list.querySelectorAll('[role="option"]'), function (option) {
        return !option.hidden && !option.disabled && option.getAttribute("aria-disabled") !== "true";
      });
    }

    function choose(option) {
      list.querySelectorAll('[role="option"]').forEach(function (other) {
        other.setAttribute("aria-selected", other === option ? "true" : "false");
      });
      var text = option.dataset.label || option.textContent.trim();
      var value = option.dataset.value !== undefined ? option.dataset.value : text;
      if (trigger) {
        if (label) label.textContent = text;
        trigger.removeAttribute("data-empty");
        trigger.dataset.nvValue = value;
        trigger.dispatchEvent(new CustomEvent("nv:select", {
          bubbles: true,
          detail: { value: value, label: text },
        }));
      }
      list.hidePopover();
      if (trigger) trigger.focus();
    }

    function focusAt(items, index) {
      if (!items.length) return;
      items[(index + items.length) % items.length].focus();
    }

    function filter() {
      var query = search.value.trim().toLowerCase();
      list.querySelectorAll('[role="option"]').forEach(function (option) {
        option.hidden = query !== "" && option.textContent.toLowerCase().indexOf(query) === -1;
      });
    }

    list.setAttribute("role", "listbox");
    if (trigger) {
      trigger.setAttribute("aria-haspopup", "listbox");
      trigger.setAttribute("aria-expanded", "false");
      trigger.addEventListener("keydown", function (event) {
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
          event.preventDefault();
          list.showPopover();
        }
      });
    }

    list.addEventListener("toggle", function (event) {
      var open = event.newState === "open";
      if (trigger) trigger.setAttribute("aria-expanded", open ? "true" : "false");
      if (!open) return;
      if (search) {
        search.value = "";
        filter();
        search.focus();
      } else {
        var items = options();
        var current = list.querySelector('[aria-selected="true"]');
        (current && !current.hidden ? current : items[0] || list).focus();
      }
    });

    list.addEventListener("click", function (event) {
      var option = event.target.closest('[role="option"]');
      if (option && list.contains(option) && !option.disabled) choose(option);
    });

    if (search) search.addEventListener("input", filter);

    list.addEventListener("keydown", function (event) {
      var items = options();
      var index = items.indexOf(document.activeElement);
      var typing = event.target === search;

      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          focusAt(items, typing ? 0 : index + 1);
          return;
        case "ArrowUp":
          event.preventDefault();
          if (typing) return;
          if (index === 0 && search) search.focus();
          else focusAt(items, index - 1);
          return;
        case "Home":
          if (typing) return;
          event.preventDefault();
          focusAt(items, 0);
          return;
        case "End":
          if (typing) return;
          event.preventDefault();
          focusAt(items, items.length - 1);
          return;
        case "Enter":
          if (typing && items.length) {
            event.preventDefault();
            choose(items[0]);
          }
          return;
      }

      // Type-ahead, for a list with nothing to type into.
      if (typing || event.ctrlKey || event.metaKey || event.altKey || event.key.length !== 1) return;
      buffer += event.key.toLowerCase();
      global.clearTimeout(bufferTimer);
      bufferTimer = global.setTimeout(function () { buffer = ""; }, 600);
      var hit = items.filter(function (option) {
        return option.textContent.trim().toLowerCase().indexOf(buffer) === 0;
      })[0];
      if (hit) hit.focus();
    });
  }

  function wire(scope) {
    scope = scope || document;

    scope.querySelectorAll("[data-nv-theme]").forEach(function (control) {
      control.addEventListener("click", function () {
        setTheme(control.dataset.nvTheme);
      });
    });

    scope.querySelectorAll("[data-nv-dialog]").forEach(function (trigger) {
      trigger.addEventListener("click", function () {
        openDialog(trigger.dataset.nvDialog, trigger);
      });
    });

    scope.querySelectorAll("[data-nv-tabs]").forEach(initTabs);
    scope.querySelectorAll("[data-nv-scroller]").forEach(initScroller);
    scope.querySelectorAll(".nv-slider").forEach(initSlider);
    scope.querySelectorAll("[data-nv-calendar]").forEach(initCalendar);
    scope.querySelectorAll("[data-nv-timepicker]").forEach(initTimePicker);
    scope.querySelectorAll(".nv-menu--listbox").forEach(initListbox);
    initReveal(scope);

    scope.querySelectorAll("[data-nv-close]").forEach(function (control) {
      control.addEventListener("click", function () {
        var owner = control.closest("dialog, [popover]");
        if (!owner) return;
        if (owner.tagName === "DIALOG") owner.close();
        else owner.hidePopover();
      });
    });

    // A dialog closes when the scrim is clicked, but not when a drag merely
    // ends there.
    scope.querySelectorAll("dialog.nv-dialog").forEach(function (dialog) {
      dialog.addEventListener("mousedown", function (event) {
        if (event.target === dialog) dialog.close();
      });
    });
  }

  global.nv = {
    transition: transition,
    setTheme: setTheme,
    syncThemeControls: syncThemeControls,
    openDialog: openDialog,
    selectTab: selectTab,
    initScroller: initScroller,
    initSlider: initSlider,
    initCalendar: initCalendar,
    initTimePicker: initTimePicker,
    initListbox: initListbox,
    liftLabels: liftLabels,
    wire: wire,
    prefersReducedMotion: prefersReducedMotion,
  };

  document.addEventListener("pointermove", trackSpotlight, { passive: true });
  document.addEventListener("pointermove", trackLight, { passive: true });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { wire(); });
  } else {
    wire();
  }
})(window);
