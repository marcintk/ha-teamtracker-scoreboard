import { snapHtml } from "ha-card-shared/test-utils";
import { render } from "lit";

export { snapHtml };

export function doc(template: unknown): HTMLElement {
  const el = document.createElement("div");
  render(template, el);
  return el;
}

export function snap(template: unknown): string {
  return snapHtml(doc(template).innerHTML);
}
