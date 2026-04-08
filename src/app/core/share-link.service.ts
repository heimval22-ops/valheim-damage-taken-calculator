import { Injectable } from '@angular/core';

import { FormState, DamageTypeEntry, ResistanceModifierEntry } from './models';
import { DAMAGE_TYPE_NAMES, DamageTypeName, DIFFICULTY_KEYS } from './constants';
import { DifficultyKey } from './models';

// ── Compact JSON key mapping ────────────────────────────────────────────────
// Short keys keep the base64 payload small while remaining debuggable.

interface SharePayload {
  /** mobPreset */
  mp: string;
  /** damageTypes — array of [typeName, value] tuples */
  dt: [string, number][];
  /** starLevel */
  sl: number;
  /** difficulty */
  df: string;
  /** extraDamagePercent */
  ed: number;
  /** maxHealth */
  mh: number;
  /** blockingSkill */
  bs: number;
  /** blockArmor */
  ba: number;
  /** armor */
  ar: number;
  /** parryMultiplier */
  pm: number;
  /** resistanceModifiers — array of [typeName, percent] tuples */
  rm: [string, number][];
  /** shieldPreset */
  sp: string;
  /** shieldQuality */
  sq: number;
  /** riskFactor */
  rf: number;
}

const DAMAGE_TYPE_NAME_SET = new Set<string>(DAMAGE_TYPE_NAMES);
const DIFFICULTY_KEY_SET = new Set<string>(DIFFICULTY_KEYS);

@Injectable({ providedIn: 'root' })
export class ShareLinkService {

  /**
   * Build a shareable URL encoding the given form state and risk factor
   * into a single `?s=<base64>` query parameter.
   */
  buildShareUrl(formState: FormState, riskFactor: number): string {
    const payload: SharePayload = {
      mp: formState.mobPreset,
      dt: formState.damageTypes.map(entry => [entry.type, entry.value]),
      sl: formState.starLevel,
      df: formState.difficulty,
      ed: formState.extraDamagePercent,
      mh: formState.maxHealth,
      bs: formState.blockingSkill,
      ba: formState.blockArmor,
      ar: formState.armor,
      pm: formState.parryMultiplier,
      rm: formState.resistanceModifiers.map(entry => [entry.type, entry.percent]),
      sp: formState.shieldPreset,
      sq: formState.shieldQuality,
      rf: riskFactor,
    };

    const jsonString = JSON.stringify(payload);
    const encoded = btoa(unescape(encodeURIComponent(jsonString)));
    const baseUrl = `${window.location.origin}${window.location.pathname}`;
    return `${baseUrl}?s=${encoded}`;
  }

  /**
   * Decode a base64-encoded share parameter back into a partial FormState
   * and risk factor. Returns `null` if the payload is invalid or corrupt.
   */
  parseShareParam(encodedValue: string): { formState: Partial<FormState>; riskFactor: number } | null {
    try {
      const jsonString = decodeURIComponent(escape(atob(encodedValue)));
      const payload = JSON.parse(jsonString) as Partial<SharePayload>;
      return this.mapPayloadToFormState(payload);
    } catch {
      return null;
    }
  }

  /**
   * Copy the given URL to the system clipboard.
   * Returns `true` on success, `false` on failure.
   */
  async copyToClipboard(url: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(url);
      return true;
    } catch {
      return false;
    }
  }

  // ── Private helpers ─────────────────────────────────────────────────────

  private mapPayloadToFormState(payload: Partial<SharePayload>): { formState: Partial<FormState>; riskFactor: number } | null {
    if (!payload || typeof payload !== 'object') return null;

    const formState: Partial<FormState> = {};

    // mobPreset
    if (typeof payload.mp === 'string') {
      formState.mobPreset = payload.mp;
    }

    // damageTypes
    if (Array.isArray(payload.dt)) {
      const validDamageTypes: DamageTypeEntry[] = [];
      for (const entry of payload.dt) {
        if (!Array.isArray(entry) || entry.length !== 2) continue;
        const [typeName, damageValue] = entry;
        if (!DAMAGE_TYPE_NAME_SET.has(typeName)) continue;
        const numericValue = Number(damageValue);
        if (!Number.isFinite(numericValue) || numericValue < 0) continue;
        validDamageTypes.push({ type: typeName as DamageTypeName, value: numericValue });
      }
      if (validDamageTypes.length > 0) {
        formState.damageTypes = validDamageTypes;
      }
    }

    // starLevel
    if (typeof payload.sl === 'number' && payload.sl >= 0 && payload.sl <= 2) {
      formState.starLevel = Math.round(payload.sl);
    }

    // difficulty
    if (typeof payload.df === 'string' && DIFFICULTY_KEY_SET.has(payload.df)) {
      formState.difficulty = payload.df as DifficultyKey;
    }

    // extraDamagePercent
    if (typeof payload.ed === 'number' && Number.isFinite(payload.ed) && payload.ed >= 0) {
      formState.extraDamagePercent = payload.ed;
    }

    // maxHealth
    if (typeof payload.mh === 'number' && Number.isFinite(payload.mh) && payload.mh > 0 && payload.mh <= 1000) {
      formState.maxHealth = payload.mh;
    }

    // blockingSkill
    if (typeof payload.bs === 'number' && Number.isFinite(payload.bs) && payload.bs >= 0 && payload.bs <= 100) {
      formState.blockingSkill = payload.bs;
    }

    // blockArmor
    if (typeof payload.ba === 'number' && Number.isFinite(payload.ba) && payload.ba >= 0 && payload.ba <= 500) {
      formState.blockArmor = payload.ba;
    }

    // armor
    if (typeof payload.ar === 'number' && Number.isFinite(payload.ar) && payload.ar >= 0 && payload.ar <= 500) {
      formState.armor = payload.ar;
    }

    // parryMultiplier
    if (typeof payload.pm === 'number' && Number.isFinite(payload.pm) && payload.pm >= 0.1 && payload.pm <= 100) {
      formState.parryMultiplier = payload.pm;
    }

    // resistanceModifiers
    if (Array.isArray(payload.rm)) {
      const validResistanceModifiers: ResistanceModifierEntry[] = [];
      for (const entry of payload.rm) {
        if (!Array.isArray(entry) || entry.length !== 2) continue;
        const [typeName, percentValue] = entry;
        if (!DAMAGE_TYPE_NAME_SET.has(typeName)) continue;
        const numericPercent = Number(percentValue);
        if (!Number.isFinite(numericPercent)) continue;
        validResistanceModifiers.push({ type: typeName as DamageTypeName, percent: numericPercent });
      }
      formState.resistanceModifiers = validResistanceModifiers;
    }

    // shieldPreset
    if (typeof payload.sp === 'string') {
      formState.shieldPreset = payload.sp;
    }

    // shieldQuality
    if (typeof payload.sq === 'number' && payload.sq >= 1 && payload.sq <= 4) {
      formState.shieldQuality = Math.round(payload.sq);
    }

    // riskFactor
    let riskFactor = 0;
    if (typeof payload.rf === 'number' && Number.isFinite(payload.rf) && payload.rf >= 0 && payload.rf <= 100) {
      riskFactor = payload.rf;
    }

    return { formState, riskFactor };
  }
}

