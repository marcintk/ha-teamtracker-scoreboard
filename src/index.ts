/// <reference path="../node_modules/ha-card-shared/globals.d.ts" />

import { DebugMetrics, SubscriptionManager } from "ha-card-shared/runtime";
import { html, nothing, render } from "lit";
import { unsafeHTML } from "lit/directives/unsafe-html.js";
import { sectionHtml } from "./render.js";
import { CARD_STYLES } from "./styles.js";
import type { CardConfig, HassStates, HomeAssistant } from "./types.js";

const STYLE_BLOCK = unsafeHTML(`<style>${CARD_STYLES}</style>`);

export class SportScoreboardCard extends HTMLElement {
  readonly _root: ShadowRoot;
  _config: CardConfig | null;
  _hass: HomeAssistant | null;
  _fixedTimer: ReturnType<typeof setInterval> | null;
  _debugTimer: ReturnType<typeof setInterval> | null;
  _renderTimer: ReturnType<typeof setTimeout> | null;
  _blinkTimer: ReturnType<typeof setTimeout> | null;
  _trackedIds: Set<string> | null;
  _trackedByPrefix: Map<string, string[]> | null;
  _subscription: SubscriptionManager;
  _debug: DebugMetrics;
  _scoreChangedAt: Map<string, number>;
  _prevScores: Map<string, { t: number; o: number }>;

  constructor() {
    super();
    this._root = this.attachShadow({ mode: "open" });
    this._config = null;
    this._hass = null;
    this._fixedTimer = null;
    this._debugTimer = null;
    this._renderTimer = null;
    this._blinkTimer = null;
    this._trackedIds = null;
    this._trackedByPrefix = null;
    this._subscription = new SubscriptionManager();
    this._debug = new DebugMetrics();
    this._scoreChangedAt = new Map();
    this._prevScores = new Map();
  }

  setConfig(config: CardConfig): void {
    this._config = config;
    this._clearSubscription();
    this._trackedIds = null;
    this._trackedByPrefix = null;
    this._scoreChangedAt.clear();
    this._prevScores.clear();
    this._startFixedTimer();
    if (this._hass) {
      this._render();
      this._subscribe();
    }
  }

  set hass(hass: HomeAssistant) {
    const isFirstCall = !this._trackedIds;
    const connectionChanged = !isFirstCall && this._hass?.connection !== hass.connection;
    const prevHass = this._hass;
    this._hass = hass;

    if (isFirstCall || connectionChanged) {
      if (connectionChanged) this._clearSubscription();
      if (this._config) {
        this._render();
      } else {
        this._buildTrackedIds(Object.keys(hass.states));
      }
      this._subscribe();
      return;
    }

    if (!this._subscription.active && this._hasRelevantChange(hass, prevHass) && this._config) {
      this._scheduleRender();
    }
  }

  _scheduleRender(): void {
    if (this._renderTimer) return;
    if (this._config?.debug) this._debug.track("filtered");
    const lazyMs = (this._config?.lazy_refresh ?? 1) * 1000;
    if (lazyMs === 0) {
      this._render();
      return;
    }
    this._renderTimer = setTimeout(() => {
      this._renderTimer = null;
      if (this._hass && this._config) this._render();
    }, lazyMs);
  }

  _subscribe(): void {
    if (!this._config || !this._hass?.connection) return;
    this._subscription.subscribe(this._hass.connection, this._trackedIds, () => {
      if (this._config?.debug) this._debug.track("events");
      this._scheduleRender();
    });
  }

  _clearSubscription(): void {
    this._subscription.clear();
    if (this._renderTimer) {
      clearTimeout(this._renderTimer);
      this._renderTimer = null;
    }
    if (this._blinkTimer) {
      clearTimeout(this._blinkTimer);
      this._blinkTimer = null;
    }
  }

  _startFixedTimer(): void {
    this._stopFixedTimer();
    const fixedMs = (this._config?.fixed_refresh ?? 60) * 1000;
    if (fixedMs > 0) {
      this._fixedTimer = setInterval(() => {
        if (this._hass && this._config) this._render();
      }, fixedMs);
    }
    if (this._config?.debug) {
      this._debugTimer = setInterval(() => {
        if (this._hass && this._config) this._refreshDebugOverlay();
      }, 1000);
    }
  }

  _refreshDebugOverlay(): void {
    const el = this._root.querySelector("#sc-debug");
    if (el) el.innerHTML = this._debug.tableHtml();
  }

  _stopFixedTimer(): void {
    if (this._fixedTimer) {
      clearInterval(this._fixedTimer);
      this._fixedTimer = null;
    }
    if (this._debugTimer) {
      clearInterval(this._debugTimer);
      this._debugTimer = null;
    }
  }

  disconnectedCallback(): void {
    this._stopFixedTimer();
    this._clearSubscription();
    this._trackedIds = null;
    this._scoreChangedAt.clear();
    this._prevScores.clear();
  }

  _detectScoreChanges(states: HassStates): void {
    for (const id of this._trackedIds ?? []) {
      const gs = states[id]?.state;
      const attr = states[id]?.attributes;
      if (gs === "IN") {
        const t = Number(attr?.team_score ?? 0);
        const o = Number(attr?.opponent_score ?? 0);
        const prev = this._prevScores.get(id);
        if (prev && (prev.t !== t || prev.o !== o)) {
          this._scoreChangedAt.set(id, Date.now());
        }
        this._prevScores.set(id, { t, o });
      } else {
        this._prevScores.delete(id);
        this._scoreChangedAt.delete(id);
      }
    }
  }

  _pruneExpiredBlinks(): void {
    if (!this._scoreChangedAt.size) return;
    const now = Date.now();
    const sections = this._config?.sections ?? [];
    for (const [id, changedAt] of this._scoreChangedAt) {
      const section = sections.find((s) => id.startsWith(s.prefix ?? ""));
      const blinkMs = (section?.score_blink ?? 5) * 1000;
      if (blinkMs <= 0 || now - changedAt >= blinkMs) {
        this._scoreChangedAt.delete(id);
      }
    }
  }

  _armBlinkTimer(): void {
    if (this._blinkTimer || !this._scoreChangedAt.size) return;
    const sections = this._config?.sections ?? [];
    const now = Date.now();
    let minExpiry = Infinity;
    for (const [id, changedAt] of this._scoreChangedAt) {
      const section = sections.find((s) => id.startsWith(s.prefix ?? ""));
      const blinkMs = (section?.score_blink ?? 5) * 1000;
      if (blinkMs > 0) minExpiry = Math.min(minExpiry, changedAt + blinkMs);
    }
    if (minExpiry === Infinity) return;
    this._blinkTimer = setTimeout(
      () => {
        this._blinkTimer = null;
        if (this._hass && this._config) this._render();
      },
      Math.max(50, minExpiry - now)
    );
  }

  _buildTrackedIds(stateKeys: string[]): void {
    const prefixes = (this._config?.sections ?? []).map((s) => s.prefix ?? "");
    this._trackedIds = new Set();
    this._trackedByPrefix = new Map(prefixes.map((p) => [p, []]));
    for (const id of stateKeys) {
      for (const p of prefixes) {
        if (id.startsWith(p)) {
          this._trackedIds.add(id);
          this._trackedByPrefix.get(p)?.push(id);
          break;
        }
      }
    }
  }

  _hasRelevantChange(newHass: HomeAssistant, prevHass: HomeAssistant | null): boolean {
    if (!prevHass || !this._config || !this._trackedIds) return true;
    for (const id of this._trackedIds) {
      if (newHass.states[id] !== prevHass.states[id]) return true;
    }
    return false;
  }

  _render(): void {
    try {
      const {
        sections,
        height,
        team_col_width,
        team_width,
        logo_width,
        score_width,
        colon_width,
        row_height,
        colors = {},
        debug,
        show_version,
      } = this._config as CardConfig;
      const states = (this._hass as HomeAssistant).states;
      const stateKeys = Object.keys(states);
      this._buildTrackedIds(stateKeys);
      this._detectScoreChanges(states);
      this._pruneExpiredBlinks();

      if (!Array.isArray(sections) || !sections.length) {
        this._showError("Add at least one section to your card config.");
        return;
      }

      if (debug) this._debug.track("rendered");

      const tw = team_width ?? team_col_width;
      const [teamAW, teamBW] = Array.isArray(tw) ? tw : [tw, tw];

      const cssVars: Record<string, string | undefined> = {
        "--scoreboard-team-col-a-width": teamAW,
        "--scoreboard-team-col-b-width": teamBW,
        "--scoreboard-logo-width": logo_width,
        "--scoreboard-score-width": score_width,
        "--scoreboard-colon-width": colon_width,
        "--scoreboard-row-height": row_height,
      };
      const varStr = Object.entries(cssVars)
        .filter(([, v]) => v)
        .map(([k, v]) => `${k}:${String(v)};`)
        .join("");

      const haCardStyle = `${height ? `height:${String(height)};min-height:${String(height)};max-height:${String(height)};overflow:hidden;` : ""}${debug || show_version ? "position:relative;" : ""}${varStr}`;

      const sectionTemplates = sections.map((s) =>
        sectionHtml(
          s,
          states,
          this._trackedByPrefix?.get(s.prefix ?? ""),
          colors,
          this._scoreChangedAt
        )
      );
      const hasContent = sectionTemplates.some((t) => t !== nothing);

      render(
        html`
          ${STYLE_BLOCK}
          <ha-card style=${haCardStyle || nothing}>
            ${debug ? unsafeHTML(`<div id="sc-debug" style="position:absolute;bottom:0;left:0;right:0;z-index:10;background:rgba(0,0,0,0.5);color:#00e676;font-family:monospace;font-size:11px;line-height:1;padding:2px 6px;pointer-events:none;">${this._debug.tableHtml()}</div>`) : nothing}
            ${
              show_version
                ? html`<div id="sc-version" style="position:absolute;top:4px;right:6px;font-family:monospace;font-size:9px;color:#888;pointer-events:none;">v${__CARD_VERSION__}</div>`
                : nothing
            }
            ${
              hasContent
                ? sectionTemplates
                : html`<div class="empty">No games found — check your section prefixes.</div>`
            }
          </ha-card>
        `,
        this._root
      );

      this._armBlinkTimer();
    } catch (e) {
      this._showError((e as Error).message);
      // biome-ignore lint/suspicious/noConsole: intentional render error logging
      console.error("ha-teamtracker-scoreboard-card render error:", e);
    }
  }

  _showError(msg: string): void {
    render(
      html`<ha-card>
        <div style="padding:12px;color:var(--error-color,red);font-size:13px;">
          <b>ha-teamtracker-scoreboard-card error:</b><br />${msg}
        </div>
      </ha-card>`,
      this._root
    );
  }

  getCardSize(): number {
    if (this._config?.height) {
      const px = parseInt(this._config.height, 10);
      if (Number.isFinite(px)) return Math.ceil(px / 50);
    }
    const rows = (this._config?.sections ?? []).reduce((n, s) => n + 1 + (s.limit ?? 10), 0);
    const rowPx = parseInt(this._config?.row_height ?? "", 10);
    const h = Number.isFinite(rowPx) ? rowPx : 28;
    return Math.max(1, Math.ceil((rows * h) / 50));
  }

  static getStubConfig(): CardConfig {
    return {
      sections: [
        {
          name: "NBA Scoreboard",
          prefix: "sensor.nba_",
          limit: 10,
          special_teams: [],
          rank_type: "win-loss",
        },
        {
          name: "NHL Scoreboard",
          prefix: "sensor.nhl_",
          limit: 5,
          special_teams: [],
          rank_type: "win-loss-otl",
        },
      ],
    };
  }
}

customElements.define("ha-teamtracker-scoreboard-card", SportScoreboardCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "ha-teamtracker-scoreboard-card",
  name: "TeamTracker Scoreboard Card",
  description: "Compact sports scoreboard powered by ha-teamtracker",
  preview: false,
});
