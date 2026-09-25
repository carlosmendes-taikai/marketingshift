/**
 * Each visitor connects their own Google Sheet: the Apps Script web app URL lives in
 * their browser only, and is sent along with each card. Nothing is stored on the server.
 */

export const SHEETS_URL_RE = /^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/;

const KEY = "unfold:sheets-url";

export function getSheetsUrl(): string | null {
  try {
    const url = localStorage.getItem(KEY);
    return url && SHEETS_URL_RE.test(url) ? url : null;
  } catch {
    return null;
  }
}

export function setSheetsUrl(url: string | null) {
  try {
    if (url) localStorage.setItem(KEY, url);
    else localStorage.removeItem(KEY);
  } catch {
    // Private mode or blocked storage: the link just won't be remembered.
  }
}

/** The script each visitor pastes into Extensions → Apps Script. Keep in sync with docs/google-sheets.md. */
export const APPS_SCRIPT = `/** @OnlyCurrentDoc */
function doPost(e) {
  const card = JSON.parse(e.postData.contents);
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["Sent at", "Card", "Summary", "Typed text", "Details"]);
    sheet.setFrozenRows(1);
  }
  sheet.appendRow([new Date(card.sentAt), card.label, card.summary, card.text, card.details]);
  return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
}`;
