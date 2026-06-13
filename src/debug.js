export class DebugMetrics {
  constructor() {
    this._data = { notifications: [], accepted: [], renders: [] };
  }

  track(key) {
    const now = Date.now();
    const arr = this._data[key];
    arr.push(now);
    const cutoff = now - 21_600_000;
    let i = 0;
    while (i < arr.length && arr[i] < cutoff) i++;
    if (i) arr.splice(0, i);
  }

  counts(key) {
    const now = Date.now();
    const arr = this._data[key];
    return {
      min1: arr.filter((t) => now - t <= 60_000).length,
      min5: arr.filter((t) => now - t <= 300_000).length,
      min30: arr.filter((t) => now - t <= 1_800_000).length,
      hour1: arr.filter((t) => now - t <= 3_600_000).length,
      hour3: arr.filter((t) => now - t <= 10_800_000).length,
      hour6: arr.length,
    };
  }

  html() {
    const cell = (n) => `<td style="padding-right:8px;text-align:right">${n}</td>`;
    const hcell = (label) =>
      `<td style="padding-right:8px;text-align:right;color:orange">${label}</td>`;
    const row = (label, key) => {
      const c = this.counts(key);
      return `<tr><td style="padding-right:10px;color:#999">${label}</td>${cell(c.min1)}${cell(c.min5)}${cell(c.min30)}${cell(c.hour1)}${cell(c.hour3)}${cell(c.hour6)}</tr>`;
    };
    const renders = this._data.renders;
    const ts = renders.length ? new Date(renders.at(-1)).toISOString().slice(11, 23) : '--';
    const footer = `<tr style="font-size:8px"><td style="padding-right:10px;color:red">${ts}</td>${hcell('1m')}${hcell('5m')}${hcell('30m')}${hcell('1h')}${hcell('3h')}${hcell('6h')}</tr>`;
    return `<div style="position:absolute;bottom:0;left:0;right:0;z-index:10;background:rgba(0,0,0,0.5);color:#00e676;font-family:monospace;font-size:9px;line-height:1.3;padding:2px 6px;pointer-events:none;"><table style="border-collapse:collapse;width:100%">${row('events', 'notifications')}${row('accepted', 'accepted')}${row('renders', 'renders')}${footer}</table></div>`;
  }
}
