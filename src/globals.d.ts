// Script-scoped ambient declarations (no import/export = global scope)
declare const __CARD_VERSION__: string;

interface Window {
  customCards?: Array<{
    type: string;
    name: string;
    description: string;
    preview: boolean;
  }>;
}
