type DebugKey = 'events' | 'filtered' | 'rendered';

interface DebugCounts {
  min1: number;
  min5: number;
  min15: number;
  min30: number;
  hour1: number;
  hour3: number;
}

import { timeAgo } from './utils.js';

export class DebugMetrics {
  _data: Record<DebugKey, number[]>;

  constructor() {
    this._data = { events: [], filtered: [], rendered: [] };
  }

  track(key: DebugKey): void {
    const now = Date.now();
    const arr = this._data[key];
    arr.push(now);
    const cutoff = now - 10_800_000;
    // arr is sorted oldest→newest (push appends); scan from front where expired entries live
    let i = 0;
    /* v8 ignore next */ while (i < arr.length && (arr[i] ?? 0) < cutoff) i++;
    if (i) arr.splice(0, i);
  }

  counts(key: DebugKey) {
    const now = Date.now();
    const arr = this._data[key];
    let min1 = 0,
      min5 = 0,
      min15 = 0,
      min30 = 0,
      hour1 = 0;
    for (let i = arr.length - 1; i >= 0; i--) {
      /* v8 ignore next */ const age = now - (arr[i] ?? 0);
      if (age > 3_600_000) break; // arr is oldest→newest; past 1h, no further entry qualifies
      if (age <= 60_000) min1++;
      if (age <= 300_000) min5++;
      if (age <= 900_000) min15++;
      if (age <= 1_800_000) min30++;
      /* v8 ignore next */ if (age <= 3_600_000) hour1++;
    }
    return { min1, min5, min15, min30, hour1, hour3: arr.length };
  }

  tableHtml(): string {
    const cell = (n: number) => `<td style="padding-right:8px;text-align:right">${n}</td>`;
    const hcell = (label: string) =>
      `<td style="padding-right:8px;text-align:right;color:orange">${label}</td>`;
    const row = (label: string, key: DebugKey) => {
      const c = this.counts(key);
      return `<tr><td style="padding-right:10px;color:orange">${label}</td>${cell(c.min1)}${cell(c.min5)}${cell(c.min15)}${cell(c.min30)}${cell(c.hour1)}${cell(c.hour3)}</tr>`;
    };
    const rendered = this._data.rendered;
    const pad = (n: number, w = 2) => String(n).padStart(w, '0');
    const ts = rendered.length
      ? (() => {
          const last = rendered.at(-1);
          /* v8 ignore next */ if (last === undefined) return '--';
          const d = new Date(last);
          const time = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`;
          const ago = timeAgo(Date.now() - last);
          return `${time} (${ago} ago)`;
        })()
      : '--';
    const footer = `<tr style="font-size:10px"><td style="padding-right:10px;color:indianred">${ts}</td>${hcell('1m')}${hcell('5m')}${hcell('15m')}${hcell('30m')}${hcell('1h')}${hcell('3h')}</tr>`;
    return `<table style="border-collapse:collapse;width:100%">${row('events', 'events')}${row('filtered', 'filtered')}${row('rendered', 'rendered')}${footer}</table>`;
  }

  html(): string {
    return `<div id="sc-debug" style="position:absolute;bottom:0;left:0;right:0;z-index:10;background:rgba(0,0,0,0.5);color:#00e676;font-family:monospace;font-size:11px;line-height:1;padding:2px 6px;pointer-events:none;">${this.tableHtml()}</div>`;
  }
}
