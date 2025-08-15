import { useEffect, useCallback, useRef, useState } from "react";

/**
 * Custom hook for implementing anti-cheat measures in duels
 * Handles fullscreen enforcement, copy/paste prevention, focus loss detection, and tab switching
 */
export const useAntiCheat = ({
  isActive = false,
  onViolation = () => {},
  onWarning = () => {},
  enableFullscreen = true,
  enableCopyPastePrevention = true,
  enableFocusDetection = true,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasFocus, setHasFocus] = useState(true);
  const [violations, setViolations] = useState([]);
  const warningTimeoutRef = useRef(null);
  const focusLostTimeRef = useRef(null);
  const violationCountRef = useRef(0);

  // Check if fullscreen is supported
  const isFullscreenSupported = useCallback(() => {
    return !!(
      document.fullscreenEnabled ||
      document.webkitFullscreenEnabled ||
      document.mozFullScreenEnabled ||
      document.msFullscreenEnabled
    );
  }, []);

  // Enter fullscreen mode
  const enterFullscreen = useCallback(async () => {
    if (!isFullscreenSupported()) {
      console.warn("Fullscreen not supported");
      return false;
    }

    try {
      const element = document.documentElement;
      if (element.requestFullscreen) {
        await element.requestFullscreen();
      } else if (element.webkitRequestFullscreen) {
        await element.webkitRequestFullscreen();
      } else if (element.mozRequestFullScreen) {
        await element.mozRequestFullScreen();
      } else if (element.msRequestFullscreen) {
        await element.msRequestFullscreen();
      }
      return true;
    } catch (error) {
      console.error("Failed to enter fullscreen:", error);
      return false;
    }
  }, [isFullscreenSupported]);

  // Exit fullscreen mode
  const exitFullscreen = useCallback(async () => {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        await document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        await document.mozCancelFullScreen();
      } else if (document.msExitFullscreen) {
        await document.msExitFullscreen();
      }
    } catch (error) {
      console.error("Failed to exit fullscreen:", error);
    }
  }, []);

  // Check if currently in fullscreen
  const checkFullscreenStatus = useCallback(() => {
    return !!(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement
    );
  }, []);

  // Handle fullscreen change events
  const handleFullscreenChange = useCallback(() => {
    const isCurrentlyFullscreen = checkFullscreenStatus();
    setIsFullscreen(isCurrentlyFullscreen);

    // If duel is active and user exited fullscreen, this is a violation
    if (isActive && enableFullscreen && !isCurrentlyFullscreen) {
      const violation = {
        type: "FULLSCREEN_EXIT",
        timestamp: new Date(),
        message: "Exited fullscreen mode during active duel",
      };

      setViolations((prev) => [...prev, violation]);
      violationCountRef.current += 1;

      onViolation(violation);
    }
  }, [isActive, enableFullscreen, checkFullscreenStatus, onViolation]);

  // Handle copy/paste/cut prevention
  const handleKeyboardEvent = useCallback(
    (event) => {
      if (!isActive || !enableCopyPastePrevention) return;

      const { ctrlKey, metaKey, key } = event;
      const isModifierPressed = ctrlKey || metaKey;

      // Prevent copy, paste, cut operations
      if (
        isModifierPressed &&
        ["c", "v", "x", "a", "s"].includes(key.toLowerCase())
      ) {
        event.preventDefault();
        event.stopPropagation();

        const violation = {
          type: "KEYBOARD_SHORTCUT",
          timestamp: new Date(),
          message: `Attempted to use ${key.toUpperCase()} shortcut during duel`,
          key: key.toLowerCase(),
        };

        setViolations((prev) => [...prev, violation]);
        onWarning(`Keyboard shortcuts are disabled during duels`);

        return false;
      }

      // Prevent F12 (Developer Tools)
      if (key === "F12") {
        event.preventDefault();
        event.stopPropagation();

        const violation = {
          type: "DEV_TOOLS_ATTEMPT",
          timestamp: new Date(),
          message: "Attempted to open developer tools",
        };

        setViolations((prev) => [...prev, violation]);
        onWarning("Developer tools are disabled during duels");

        return false;
      }

      // Prevent Ctrl+Shift+I (Developer Tools)
      if (isModifierPressed && event.shiftKey && key.toLowerCase() === "i") {
        event.preventDefault();
        event.stopPropagation();

        const violation = {
          type: "DEV_TOOLS_ATTEMPT",
          timestamp: new Date(),
          message: "Attempted to open developer tools via shortcut",
        };

        setViolations((prev) => [...prev, violation]);
        onWarning("Developer tools are disabled during duels");

        return false;
      }
    },
    [isActive, enableCopyPastePrevention, onViolation, onWarning]
  );

  // Handle context menu prevention (right-click)
  const handleContextMenu = useCallback(
    (event) => {
      if (!isActive) return;

      event.preventDefault();
      onWarning("Right-click is disabled during duels");
    },
    [isActive, onWarning]
  );

  // Handle window focus/blur events
  const handleWindowFocus = useCallback(() => {
    setHasFocus(true);

    // Clear the focus lost timer if user returns quickly
    if (focusLostTimeRef.current) {
      clearTimeout(focusLostTimeRef.current);
      focusLostTimeRef.current = null;
    }
  }, []);

  const handleWindowBlur = useCallback(() => {
    if (!isActive || !enableFocusDetection) return;

    setHasFocus(false);

    // Give user a grace period to return (3 seconds)
    focusLostTimeRef.current = setTimeout(() => {
      const violation = {
        type: "FOCUS_LOST",
        timestamp: new Date(),
        message: "Lost focus/switched tabs during active duel",
      };

      setViolations((prev) => [...prev, violation]);
      violationCountRef.current += 1;

      onViolation(violation);
    }, 3000); // 3 second grace period
  }, [isActive, enableFocusDetection, onViolation]);

  // Handle visibility change (tab switching)
  const handleVisibilityChange = useCallback(() => {
    if (!isActive || !enableFocusDetection) return;

    if (document.hidden) {
      setHasFocus(false);

      // Immediate violation for tab switching
      const violation = {
        type: "TAB_SWITCH",
        timestamp: new Date(),
        message: "Switched to another tab during active duel",
      };

      setViolations((prev) => [...prev, violation]);
      violationCountRef.current += 1;

      onViolation(violation);
    } else {
      setHasFocus(true);
    }
  }, [isActive, enableFocusDetection, onViolation]);

  // Initialize anti-cheat measures when duel becomes active
  useEffect(() => {
    if (isActive && enableFullscreen && isFullscreenSupported()) {
      enterFullscreen();
    }
  }, [isActive, enableFullscreen, enterFullscreen, isFullscreenSupported]);

  // Set up event listeners
  useEffect(() => {
    if (!isActive) return;

    // Keyboard event listeners
    document.addEventListener("keydown", handleKeyboardEvent, true);
    document.addEventListener("contextmenu", handleContextMenu);

    // Fullscreen event listeners
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);

    // Focus/blur event listeners
    window.addEventListener("focus", handleWindowFocus);
    window.addEventListener("blur", handleWindowBlur);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      // Clean up event listeners
      document.removeEventListener("keydown", handleKeyboardEvent, true);
      document.removeEventListener("contextmenu", handleContextMenu);

      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange
      );
      document.removeEventListener(
        "mozfullscreenchange",
        handleFullscreenChange
      );
      document.removeEventListener(
        "MSFullscreenChange",
        handleFullscreenChange
      );

      window.removeEventListener("focus", handleWindowFocus);
      window.removeEventListener("blur", handleWindowBlur);
      document.removeEventListener("visibilitychange", handleVisibilityChange);

      // Clear any pending timeouts
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
      if (focusLostTimeRef.current) {
        clearTimeout(focusLostTimeRef.current);
      }
    };
  }, [
    isActive,
    handleKeyboardEvent,
    handleContextMenu,
    handleFullscreenChange,
    handleWindowFocus,
    handleWindowBlur,
    handleVisibilityChange,
  ]);

  // Clean up when component unmounts or duel ends
  useEffect(() => {
    return () => {
      if (isFullscreen && !isActive) {
        exitFullscreen();
      }
    };
  }, [isActive, isFullscreen, exitFullscreen]);

  return {
    isFullscreen,
    hasFocus,
    violations,
    violationCount: violationCountRef.current,
    enterFullscreen,
    exitFullscreen,
    isFullscreenSupported: isFullscreenSupported(),
  };
};

export default useAntiCheat;
