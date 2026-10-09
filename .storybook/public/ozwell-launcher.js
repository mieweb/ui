/** Let the hosted Ozwell launcher move out of the way of Storybook controls. */
(function () {
  var storageKey = 'mieweb-ui-ozwell-launcher-position';
  var button = null;
  var position = null;
  var drag = null;
  var suppressClick = false;

  try {
    var saved = JSON.parse(window.localStorage.getItem(storageKey));
    if (saved && Number.isFinite(saved.x) && Number.isFinite(saved.y)) {
      position = saved;
    }
  } catch (_) {
    // Moving the launcher still works when browser storage is unavailable.
  }

  function savePosition() {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(position));
    } catch (_) {}
  }

  // Renders `next` clamped to the viewport and returns the clamped point.
  // Callers assign the result to `position` only for user-chosen moves, so a
  // resize renders a temporary clamp without discarding the desired position.
  function place(next) {
    // The loader hides the button while chat is open. Retain its 60px size
    // when hidden so a resize cannot strand it outside the viewport.
    var maxX = Math.max(0, window.innerWidth - (button.offsetWidth || 60));
    var maxY = Math.max(0, window.innerHeight - (button.offsetHeight || 60));
    var marginX = Math.min(12, maxX / 2);
    var marginY = Math.min(12, maxY / 2);
    var clamped = {
      x: Math.max(marginX, Math.min(maxX - marginX, next.x)),
      y: Math.max(marginY, Math.min(maxY - marginY, next.y)),
    };
    button.style.left = clamped.x + 'px';
    button.style.top = clamped.y + 'px';
    button.style.right = 'auto';
    button.style.bottom = 'auto';
    return clamped;
  }

  function endDrag(event) {
    if (!drag || (event && event.pointerId !== drag.pointerId)) return;
    var ended = drag;
    drag = null;
    button.style.cursor = 'grab';
    if (ended.moved) {
      suppressClick = true;
      savePosition();
    }
    if (button.hasPointerCapture(ended.pointerId)) {
      button.releasePointerCapture(ended.pointerId);
    }
  }

  function install() {
    var next = document.getElementById('ozwell-chat-button');
    if (!next || next === button) return;
    endDrag();
    button = next;
    suppressClick = false;
    button.style.touchAction = 'none';
    button.style.userSelect = 'none';
    button.style.cursor = 'grab';
    button.title = 'Open chat · Drag to move, or use Alt + arrow keys';
    button.setAttribute('aria-description', 'Drag to move, or use Alt + arrow keys.');
    button.setAttribute(
      'aria-keyshortcuts',
      'Alt+ArrowLeft Alt+ArrowRight Alt+ArrowUp Alt+ArrowDown'
    );
    if (position) place(position);

    // The CDN replaces the image on open/close; handle native image dragging
    // on the button so replacement children inherit this behavior.
    button.addEventListener('dragstart', function (event) {
      event.preventDefault();
    });
    button.addEventListener('click', function (event) {
      // Keyboard activation has detail=0 and must still open chat. Keep the
      // flag until the release click or the next press (also covers touch).
      if (suppressClick && event.detail > 0) {
        suppressClick = false;
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    }, true);
    button.addEventListener('pointerdown', function (event) {
      if (event.button !== 0 || !event.isPrimary || drag) return;
      suppressClick = false;
      drag = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        // Layout offsets exclude the loader's hover scale/unread wiggle.
        x: button.offsetLeft,
        y: button.offsetTop,
        moved: false,
      };
      button.setPointerCapture(event.pointerId);
    });
    button.addEventListener('pointermove', function (event) {
      if (!drag || event.pointerId !== drag.pointerId) return;
      var dx = event.clientX - drag.startX;
      var dy = event.clientY - drag.startY;
      if (!drag.moved && Math.hypot(dx, dy) < 5) return;
      drag.moved = true;
      button.style.cursor = 'grabbing';
      event.preventDefault();
      position = place({ x: drag.x + dx, y: drag.y + dy });
    });
    button.addEventListener('pointerup', endDrag);
    button.addEventListener('pointercancel', endDrag);
    button.addEventListener('lostpointercapture', endDrag);
    button.addEventListener('keydown', function (event) {
      if (!event.altKey || drag) return;
      var directions = {
        ArrowLeft: [-1, 0],
        ArrowRight: [1, 0],
        ArrowUp: [0, -1],
        ArrowDown: [0, 1],
      };
      var direction = directions[event.key];
      if (!direction) return;
      event.preventDefault();
      var step = event.shiftKey ? 100 : 20;
      position = place({
        x: button.offsetLeft + direction[0] * step,
        y: button.offsetTop + direction[1] * step,
      });
      savePosition();
    });
  }

  // The async CDN loader may mount after DOMContentLoaded or replace the
  // launcher later. Observe its arrival without depending on loader timing.
  new MutationObserver(install).observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
  window.addEventListener('resize', function () {
    if (button && position) place(position);
  });
  install();
})();
