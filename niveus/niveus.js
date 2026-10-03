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
    liftLabels: liftLabels,
    wire: wire,
    prefersReducedMotion: prefersReducedMotion,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { wire(); });
  } else {
    wire();
  }
})(window);
