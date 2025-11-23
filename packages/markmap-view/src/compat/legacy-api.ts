/**
 * Legacy API Compatibility Layer
 *
 * This module provides backward compatibility for the old Markmap API.
 * It ensures that existing code continues to work without modifications
 * while the new architecture is being adopted.
 *
 * Requirements:
 * - 10.1: Markmap.create should work with default UI
 * - 10.2: Old configuration options should be correctly parsed
 * - 10.3: Old API methods should execute the same functionality
 */

import type { IMarkmapOptions } from '../types';

/**
 * Migrate old configuration options to new format.
 *
 * This function takes configuration options from the old API format
 * and converts them to the new format, ensuring backward compatibility.
 *
 * Requirements:
 * - 10.2: Parse and apply old configuration options correctly
 *
 * @param oldConfig - Configuration options in old format
 * @returns Configuration options in new format
 */
export function migrateConfig(oldConfig: any): Partial<IMarkmapOptions> {
  // Most options remain the same, just pass them through
  const newConfig: Partial<IMarkmapOptions> = {
    ...oldConfig,
  };

  // Handle any specific migrations if needed
  // For now, the options structure is compatible

  return newConfig;
}

/**
 * Check if the current Markmap instance is using the new architecture.
 *
 * This helper function can be used to detect if a Markmap instance
 * has been created with the new architecture (with DIContainer and EventEmitter)
 * or the old architecture.
 *
 * @param markmap - Markmap instance to check
 * @returns True if using new architecture, false otherwise
 */
export function isNewArchitecture(markmap: any): boolean {
  return !!(markmap.getContainer && markmap.getEventEmitter);
}

/**
 * Get a compatibility wrapper for the Markmap instance.
 *
 * This function returns a wrapper that provides the same API as the old
 * Markmap class, but uses the new architecture internally.
 *
 * Requirements:
 * - 10.3: Old API methods should execute the same functionality
 *
 * @param markmap - Markmap instance
 * @returns Compatibility wrapper
 */
export function getCompatibilityWrapper(markmap: any) {
  return {
    // All methods are already available on the Markmap instance
    // This wrapper is here for future compatibility needs
    ...markmap,
  };
}
