import { Injectable, isDevMode } from '@angular/core';

import { DifficultyKey } from './models';

// ── Extend the Window type with the gtag global ────────────────────────────
declare global {
  interface Window {
    gtag: (
      command: 'event' | 'config' | 'js',
      target: string | Date,
      params?: Record<string, unknown>,
    ) => void;
    dataLayer: unknown[];
  }
}

// ── Parameter shapes for each tracked event ────────────────────────────────

export interface HitCalculatedEventParams {
  difficulty: DifficultyKey;
  starLevel: number;
  blockArmor: number;
  armor: number;
  hasRiskFactor: boolean;
}

export interface TabSwitchedEventParams {
  tabName: string;
}

export interface MobPresetSelectedEventParams {
  presetId: string;
}

export interface PageViewEventParams {
  pagePath: string;
  pageTitle: string;
}

// ── Service ────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class AnalyticsService {

  /** Low-level wrapper — skips silently if gtag is not available (e.g. blocked by an ad blocker). */
  private sendEvent(eventName: string, eventParams: Record<string, string | number | boolean> = {}): void {
    if (isDevMode()) {
      console.debug('[Analytics]', eventName, eventParams);
      return;
    }

    try {
      window.gtag('event', eventName, eventParams);
    } catch {
      // gtag not loaded — silently ignore
    }
  }

  /**
   * Track a virtual page view.
   * Called once per router navigation so GA4 sees each route as a separate page.
   */
  trackPageView(params: PageViewEventParams): void {
    this.sendEvent('page_view', {
      page_path: params.pagePath,
      page_title: params.pageTitle,
    });
  }

  /**
   * Track when the user switches between the Hit Simulator and Hit Analyzer tabs.
   * Helps identify which tool is used more.
   */
  trackTabSwitched(params: TabSwitchedEventParams): void {
    this.sendEvent('tab_switched', {
      tab_name: params.tabName,
    });
  }

  /**
   * Track each time the user clicks "Hit" to run a damage calculation.
   * Captures the key input parameters so we can understand which scenarios are analysed.
   */
  trackHitCalculated(params: HitCalculatedEventParams): void {
    this.sendEvent('hit_calculated', {
      difficulty: params.difficulty,
      star_level: params.starLevel,
      block_armor: params.blockArmor,
      armor: params.armor,
      has_risk_factor: params.hasRiskFactor,
    });
  }

  /**
   * Track when the user resets all form inputs back to defaults.
   */
  trackFormReset(): void {
    this.sendEvent('form_reset');
  }

  /**
   * Track which mob preset the user loads.
   * Helps identify the most popular creatures / attacks.
   */
  trackMobPresetSelected(params: MobPresetSelectedEventParams): void {
    this.sendEvent('mob_preset_selected', {
      preset_id: params.presetId,
    });
  }
}



