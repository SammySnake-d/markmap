/**
 * TouchManager handles touch gestures for mobile devices.
 *
 * This class provides support for:
 * - Single-finger pan (drag) gestures
 * - Two-finger pinch-to-zoom gestures
 * - Single tap on nodes to toggle expand/collapse
 * - Long press on nodes to show context menu
 * - Screen orientation change adaptation
 *
 * Requirements:
 * - 11.2: Support single-finger drag to pan canvas
 * - 11.3: Support two-finger pinch to zoom canvas
 * - 11.4: Single tap on node toggles expand/collapse
 * - 11.5: Long press on node shows context menu
 * - 11.6: Adapt to screen orientation changes
 */
export class TouchManager {
  private svg: SVGElement | null = null;
  private enabled = false;

  // Touch state tracking
  private startDistance = 0;
  private startScale = 1;
  private lastTouchX = 0;
  private lastTouchY = 0;
  private touchStartTime = 0;
  private touchStartX = 0;
  private touchStartY = 0;
  private hasMoved = false;
  private longPressTimer: number | null = null;
  private touchedElement: Element | null = null;

  // Constants for gesture detection
  private readonly LONG_PRESS_DURATION = 500; // milliseconds
  private readonly MOVE_THRESHOLD = 10; // pixels

  // Bound event handlers for cleanup
  private boundHandleTouchStart: ((e: TouchEvent) => void) | null = null;
  private boundHandleTouchMove: ((e: TouchEvent) => void) | null = null;
  private boundHandleTouchEnd: ((e: TouchEvent) => void) | null = null;
  private boundHandleOrientationChange: ((e: Event) => void) | null = null;

  // Callbacks for pan and zoom actions
  private onPan: ((dx: number, dy: number) => void) | null = null;
  private onZoom:
    | ((scale: number, centerX: number, centerY: number) => void)
    | null = null;
  private onNodeTap: ((element: Element, x: number, y: number) => void) | null =
    null;
  private onNodeLongPress:
    | ((element: Element, x: number, y: number) => void)
    | null = null;
  private onOrientationChange: (() => void) | null = null;

  /**
   * Creates a new TouchManager instance.
   *
   * @param onPan - Callback function for pan gestures (dx, dy)
   * @param onZoom - Callback function for zoom gestures (scale, centerX, centerY)
   * @param onNodeTap - Callback function for node tap gestures (element, x, y)
   * @param onNodeLongPress - Callback function for node long press gestures (element, x, y)
   * @param onOrientationChange - Callback function for orientation change events
   */
  constructor(
    onPan?: (dx: number, dy: number) => void,
    onZoom?: (scale: number, centerX: number, centerY: number) => void,
    onNodeTap?: (element: Element, x: number, y: number) => void,
    onNodeLongPress?: (element: Element, x: number, y: number) => void,
    onOrientationChange?: () => void,
  ) {
    this.onPan = onPan || null;
    this.onZoom = onZoom || null;
    this.onNodeTap = onNodeTap || null;
    this.onNodeLongPress = onNodeLongPress || null;
    this.onOrientationChange = onOrientationChange || null;
  }

  /**
   * Enables touch support on the given SVG element.
   *
   * Requirement 11.2: Support single-finger drag to pan canvas
   * Requirement 11.3: Support two-finger pinch to zoom canvas
   * Requirement 11.6: Adapt to screen orientation changes
   *
   * @param svg - The SVG element to attach touch handlers to
   */
  public enableTouch(svg: SVGElement): void {
    if (this.enabled && this.svg === svg) {
      return; // Already enabled on this element
    }

    // Disable on previous element if any
    if (this.enabled) {
      this.disableTouch();
    }

    this.svg = svg;
    this.enabled = true;

    // Create bound handlers for cleanup
    this.boundHandleTouchStart = this.handleTouchStart.bind(this);
    this.boundHandleTouchMove = this.handleTouchMove.bind(this);
    this.boundHandleTouchEnd = this.handleTouchEnd.bind(this);
    this.boundHandleOrientationChange = this.handleOrientationChange.bind(this);

    // Attach event listeners
    svg.addEventListener('touchstart', this.boundHandleTouchStart, {
      passive: false,
    });
    svg.addEventListener('touchmove', this.boundHandleTouchMove, {
      passive: false,
    });
    svg.addEventListener('touchend', this.boundHandleTouchEnd, {
      passive: false,
    });
    svg.addEventListener('touchcancel', this.boundHandleTouchEnd, {
      passive: false,
    });

    // Listen for orientation changes
    window.addEventListener(
      'orientationchange',
      this.boundHandleOrientationChange,
    );
  }

  /**
   * Disables touch support and removes all event listeners.
   */
  public disableTouch(): void {
    if (!this.enabled || !this.svg) {
      return;
    }

    // Remove event listeners
    if (this.boundHandleTouchStart) {
      this.svg.removeEventListener('touchstart', this.boundHandleTouchStart);
    }
    if (this.boundHandleTouchMove) {
      this.svg.removeEventListener('touchmove', this.boundHandleTouchMove);
    }
    if (this.boundHandleTouchEnd) {
      this.svg.removeEventListener('touchend', this.boundHandleTouchEnd);
      this.svg.removeEventListener('touchcancel', this.boundHandleTouchEnd);
    }
    if (this.boundHandleOrientationChange) {
      window.removeEventListener(
        'orientationchange',
        this.boundHandleOrientationChange,
      );
    }

    // Clear references
    this.boundHandleTouchStart = null;
    this.boundHandleTouchMove = null;
    this.boundHandleTouchEnd = null;
    this.boundHandleOrientationChange = null;
    this.svg = null;
    this.enabled = false;
  }

  /**
   * Sets the pan callback function.
   *
   * @param callback - Function to call when pan gesture is detected
   */
  public setPanCallback(callback: (dx: number, dy: number) => void): void {
    this.onPan = callback;
  }

  /**
   * Sets the zoom callback function.
   *
   * @param callback - Function to call when zoom gesture is detected
   */
  public setZoomCallback(
    callback: (scale: number, centerX: number, centerY: number) => void,
  ): void {
    this.onZoom = callback;
  }

  /**
   * Sets the node tap callback function.
   *
   * @param callback - Function to call when node tap is detected
   */
  public setNodeTapCallback(
    callback: (element: Element, x: number, y: number) => void,
  ): void {
    this.onNodeTap = callback;
  }

  /**
   * Sets the node long press callback function.
   *
   * @param callback - Function to call when node long press is detected
   */
  public setNodeLongPressCallback(
    callback: (element: Element, x: number, y: number) => void,
  ): void {
    this.onNodeLongPress = callback;
  }

  /**
   * Sets the orientation change callback function.
   *
   * @param callback - Function to call when screen orientation changes
   */
  public setOrientationChangeCallback(callback: () => void): void {
    this.onOrientationChange = callback;
  }

  /**
   * Handles the touchstart event.
   *
   * Initializes touch tracking for both pan and pinch gestures.
   * Also detects if a node was touched for tap/long-press gestures.
   *
   * Requirements:
   * - 11.4: Detect single tap on node
   * - 11.5: Detect long press on node
   *
   * @param e - The touch event
   */
  private handleTouchStart(e: TouchEvent): void {
    if (e.touches.length === 1) {
      // Single touch - prepare for pan or node interaction
      this.lastTouchX = e.touches[0].clientX;
      this.lastTouchY = e.touches[0].clientY;
      this.touchStartX = e.touches[0].clientX;
      this.touchStartY = e.touches[0].clientY;
      this.touchStartTime = Date.now();
      this.hasMoved = false;

      // Check if touch started on a node
      const target = e.target as Element;
      this.touchedElement = this.findNodeElement(target);

      // If touched a node, start long press timer
      if (this.touchedElement) {
        this.longPressTimer = window.setTimeout(() => {
          // Long press detected
          if (!this.hasMoved && this.touchedElement && this.onNodeLongPress) {
            this.onNodeLongPress(
              this.touchedElement,
              this.touchStartX,
              this.touchStartY,
            );
            // Clear the touched element to prevent tap from firing
            this.touchedElement = null;
          }
        }, this.LONG_PRESS_DURATION);
      }
    } else if (e.touches.length === 2) {
      // Two touches - prepare for pinch
      // Cancel any pending long press
      this.cancelLongPress();

      const distance = this.detectPinch(e.touches);
      if (distance !== null) {
        this.startDistance = distance;
        this.startScale = 1;
      }
      // Prevent default to avoid browser zoom
      e.preventDefault();
    }
  }

  /**
   * Handles the touchmove event.
   *
   * Detects and processes pan or pinch gestures.
   * Cancels long press if finger moves too much.
   *
   * Requirement 11.2: Single-finger drag pans the canvas
   * Requirement 11.3: Two-finger pinch zooms the canvas
   *
   * @param e - The touch event
   */
  private handleTouchMove(e: TouchEvent): void {
    if (e.touches.length === 1) {
      // Check if moved beyond threshold
      const dx = e.touches[0].clientX - this.touchStartX;
      const dy = e.touches[0].clientY - this.touchStartY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > this.MOVE_THRESHOLD) {
        this.hasMoved = true;
        // Cancel long press if moved too much
        this.cancelLongPress();
      }

      // Single touch - pan gesture
      const pan = this.detectPan(e.touches);
      if (pan && this.onPan) {
        this.onPan(pan.dx, pan.dy);
        // Prevent default scrolling
        e.preventDefault();
      }
    } else if (e.touches.length === 2) {
      // Cancel long press on multi-touch
      this.cancelLongPress();

      // Two touches - pinch gesture
      const currentDistance = this.detectPinch(e.touches);
      if (currentDistance !== null && this.startDistance > 0) {
        const scale = currentDistance / this.startDistance;

        // Calculate center point between two touches
        const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2;

        if (this.onZoom) {
          this.onZoom(scale, centerX, centerY);
        }

        // Update start distance for next move
        this.startDistance = currentDistance;

        // Prevent default to avoid browser zoom
        e.preventDefault();
      }
    }
  }

  /**
   * Handles the touchend and touchcancel events.
   *
   * Resets touch tracking state and handles tap gesture.
   *
   * Requirements:
   * - 11.4: Single tap on node toggles expand/collapse
   *
   * @param e - The touch event
   */
  private handleTouchEnd(e: TouchEvent): void {
    // Check for tap gesture (touch ended without moving)
    if (
      e.touches.length === 0 &&
      !this.hasMoved &&
      this.touchedElement &&
      this.onNodeTap
    ) {
      // Tap detected on a node
      this.onNodeTap(this.touchedElement, this.touchStartX, this.touchStartY);
    }

    // Cancel any pending long press
    this.cancelLongPress();

    // Reset state when all touches are released
    if (e.touches.length === 0) {
      this.startDistance = 0;
      this.startScale = 1;
      this.lastTouchX = 0;
      this.lastTouchY = 0;
      this.touchStartTime = 0;
      this.touchStartX = 0;
      this.touchStartY = 0;
      this.hasMoved = false;
      this.touchedElement = null;
    } else if (e.touches.length === 1) {
      // One touch remaining - reset to pan mode
      this.lastTouchX = e.touches[0].clientX;
      this.lastTouchY = e.touches[0].clientY;
      this.startDistance = 0;
      this.startScale = 1;
      this.touchedElement = null;
    }
  }

  /**
   * Detects a pinch gesture and calculates the distance between two touch points.
   *
   * Requirement 11.3: Detect two-finger pinch gesture
   *
   * @param touches - The TouchList containing touch points
   * @returns The distance between the two touches, or null if invalid
   */
  private detectPinch(touches: TouchList): number | null {
    if (touches.length !== 2) {
      return null;
    }

    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    return distance;
  }

  /**
   * Detects a pan gesture and calculates the movement delta.
   *
   * Requirement 11.2: Detect single-finger drag gesture
   *
   * @param touches - The TouchList containing touch points
   * @returns The movement delta {dx, dy}, or null if invalid
   */
  private detectPan(touches: TouchList): { dx: number; dy: number } | null {
    if (touches.length !== 1) {
      return null;
    }

    const currentX = touches[0].clientX;
    const currentY = touches[0].clientY;

    const dx = currentX - this.lastTouchX;
    const dy = currentY - this.lastTouchY;

    // Update last position for next move
    this.lastTouchX = currentX;
    this.lastTouchY = currentY;

    return { dx, dy };
  }

  /**
   * Checks if touch support is currently enabled.
   *
   * @returns True if touch support is enabled, false otherwise
   */
  public isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Gets the current SVG element that touch support is enabled on.
   *
   * @returns The SVG element, or null if not enabled
   */
  public getSvgElement(): SVGElement | null {
    return this.svg;
  }

  /**
   * Finds the closest node element from a touch target.
   *
   * This method traverses up the DOM tree to find a markmap node element.
   *
   * @param target - The element that was touched
   * @returns The node element, or null if not found
   */
  private findNodeElement(target: Element): Element | null {
    let current: Element | null = target;

    // Traverse up the DOM tree to find a node element
    while (current && current !== this.svg) {
      // Check if this is a markmap node group
      if (
        current.tagName === 'g' &&
        current.classList.contains('markmap-node')
      ) {
        return current;
      }

      // Check if parent is a markmap node
      const parent = current.parentElement;
      if (
        parent &&
        parent.tagName === 'g' &&
        parent.classList.contains('markmap-node')
      ) {
        return parent;
      }

      current = parent;
    }

    return null;
  }

  /**
   * Cancels any pending long press timer.
   */
  private cancelLongPress(): void {
    if (this.longPressTimer !== null) {
      window.clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  }

  /**
   * Handles the orientationchange event.
   *
   * When the screen orientation changes, this method triggers the callback
   * to allow the application to re-layout and maintain the current view state.
   *
   * Requirement 11.6: Adapt to screen orientation changes
   */
  private handleOrientationChange(): void {
    // Cancel any ongoing touch interactions
    this.cancelLongPress();

    // Reset touch state
    this.startDistance = 0;
    this.startScale = 1;
    this.lastTouchX = 0;
    this.lastTouchY = 0;
    this.touchStartTime = 0;
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.hasMoved = false;
    this.touchedElement = null;

    // Trigger the orientation change callback
    if (this.onOrientationChange) {
      this.onOrientationChange();
    }
  }
}
