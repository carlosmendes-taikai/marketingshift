# Send to Google Sheets

The "Send to Google Sheets" button appends each card as a row in a Google Sheet. It uses a small Apps Script web app attached to the sheet: free, no Zapier, no API keys.

## Setup

1. Create a Google Sheet (for example "Marketingshift cards").
2. Open **Extensions → Apps Script**, delete what is there and paste the script below. Save.
3. Click **Deploy → New deployment**, pick the type **Web app**, set **Execute as: Me** and **Who has access: Anyone**, then **Deploy** and authorize.
4. Copy the **Web app URL** (`https://script.google.com/macros/s/.../exec`) and set it as `SHEETS_WEBHOOK_URL` on the server (Vercel project settings and `.env.local`).

```js
function doPost(e) {
  const card = JSON.parse(e.postData.contents);
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["Sent at", "Card", "Summary", "Typed text", "Details"]);
    sheet.setFrozenRows(1);
  }
  sheet.appendRow([new Date(card.sentAt), card.label, card.summary, card.text, card.details]);
  return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
}
```

## What is sent

`intent`, `label`, `summary`, `text`, `details` (readable "Label: value" lines), `data` (the raw parsed fields) and `sentAt`. The script above writes the first five columns; add more if a card type needs its own columns.
