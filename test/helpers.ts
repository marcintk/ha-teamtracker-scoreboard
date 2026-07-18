import { render } from "lit";

/** Render a Lit template into a detached div and return the element. */
export function doc(template: unknown): HTMLElement {
  const el = document.createElement("div");
  render(template, el);
  return el;
}

/**
 * Rendered innerHTML with Lit's non-deterministic marker IDs normalized, so
 * structural snapshots stay stable across module loads. Lit injects markers
 * like `<!--?lit$013215205$-->`; the numeric id changes every run.
 */
export function snap(template: unknown): string {
  return doc(template).innerHTML.replace(/lit\$\d+\$/g, "lit$");
}

/** Same normalization for raw HTML strings (e.g. element.outerHTML). */
export function snapHtml(html: string): string {
  return html.replace(/<!--\?lit\$\d+\$-->/g, "<!--?-->").replace(/lit\$\d+\$/g, "lit$");
}
