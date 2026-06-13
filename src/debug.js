export class DebugMetrics {
  constructor() {
    this._data = { events: [], accepted: [], renders: [] };
  }

  track(key) {
    const now = Date.now();
    const arr = this._data[key];
    arr.push(now);
    const cutoff = now - 10_800_000;
    // arr is sorted oldest→newest (push appends); scan from front where expired entries live
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
      min15: arr.filter((t) => now - t <= 900_000).length,
      min30: arr.filter((t) => now - t <= 1_800_000).length,
      hour1: arr.filter((t) => now - t <= 3_600_000).length,
      hour3: arr.length,
    };
  }

  _timeAgo(ms) {
    if (ms < 60_000) return `${Math.floor(ms / 1_000)}s`;
    if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m`;
    return `${Math.floor(ms / 3_600_000)}h`;
  }

  tableHtml() {
    const cell = (n) => `<td style="padding-right:8px;text-align:right">${n}</td>`;
    const hcell = (label) =>
      `<td style="padding-right:8px;text-align:right;color:orange">${label}</td>`;
    const row = (label, key) => {
      const c = this.counts(key);
      return `<tr><td style="padding-right:10px;color:orange">${label}</td>${cell(c.min1)}${cell(c.min5)}${cell(c.min15)}${cell(c.min30)}${cell(c.hour1)}${cell(c.hour3)}</tr>`;
    };
    const renders = this._data.renders;
    const pad = (n, w = 2) => String(n).padStart(w, '0');
    const ts = renders.length
      ? (() => {
          const last = renders.at(-1);
          const d = new Date(last);
          const time = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`;
          const ago = this._timeAgo(Date.now() - last);
          return `${time} (${ago} ago)`;
        })()
      : '--';
    const footer = `<tr style="font-size:10px"><td style="padding-right:10px;color:red">${ts}</td>${hcell('1m')}${hcell('5m')}${hcell('15m')}${hcell('30m')}${hcell('1h')}${hcell('3h')}</tr>`;
    return `<table style="border-collapse:collapse;width:100%">${row('events', 'events')}${row('accepted', 'accepted')}${row('renders', 'renders')}${footer}</table>`;
  }

  html() {
    return `<div id="sc-debug" style="position:absolute;bottom:0;left:0;right:0;z-index:10;background:rgba(0,0,0,0.5);color:#00e676;font-family:monospace;font-size:11px;line-height:1;padding:2px 6px;pointer-events:none;">${this.tableHtml()}</div>`;
  }
}
