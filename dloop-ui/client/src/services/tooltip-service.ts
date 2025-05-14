/**
 * Service to manage tooltip preferences and state
 * Handles storing and retrieving user preferences for tooltips
 */

// Local storage key for tooltip preferences
const TOOLTIP_PREFS_KEY = 'dloop_tooltip_prefs';

// Interface for tooltip preferences
interface TooltipPreferences {
  // Maps tooltip ID to a boolean indicating if it should be shown
  [id: string]: boolean;
}

class TooltipService {
  private preferences: TooltipPreferences;

  constructor() {
    this.preferences = this.loadPreferences();
  }

  /**
   * Load tooltip preferences from local storage
   */
  private loadPreferences(): TooltipPreferences {
    if (typeof window === 'undefined') {
      return {};
    }

    try {
      const storedPrefs = localStorage.getItem(TOOLTIP_PREFS_KEY);
      return storedPrefs ? JSON.parse(storedPrefs) : {};
    } catch (error) {
      console.error('Error loading tooltip preferences:', error);
      return {};
    }
  }

  /**
   * Save tooltip preferences to local storage
   */
  private savePreferences(): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      localStorage.setItem(TOOLTIP_PREFS_KEY, JSON.stringify(this.preferences));
    } catch (error) {
      console.error('Error saving tooltip preferences:', error);
    }
  }

  /**
   * Check if a tooltip should be shown
   * @param id Tooltip identifier
   * @returns Boolean indicating if the tooltip should be shown
   */
  shouldShowTooltip(id: string): boolean {
    // If preference doesn't exist, default to showing the tooltip
    return this.preferences[id] !== false;
  }

  /**
   * Hide a tooltip permanently
   * @param id Tooltip identifier
   */
  hideTooltipPermanently(id: string): void {
    this.preferences[id] = false;
    this.savePreferences();
  }

  /**
   * Reset a tooltip to be shown again
   * @param id Tooltip identifier
   */
  resetTooltip(id: string): void {
    delete this.preferences[id];
    this.savePreferences();
  }

  /**
   * Reset all tooltip preferences
   */
  resetAllTooltips(): void {
    this.preferences = {};
    this.savePreferences();
  }
}

// Export a singleton instance
export const tooltipService = new TooltipService();