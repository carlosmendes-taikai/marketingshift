# Send to Google Sheets

Every card has a **Send to Google Sheets** button. Each visitor connects their own sheet once: the app shows these steps, and the sheet link is saved in that visitor's browser only. Nothing is stored on the server, which only passes each card along to the visitor's own sheet.

## Connect your sheet

1. Open a new sheet at [sheets.new](https://sheets.new).
2. Go to **Extensions → Apps Script**, replace the code with the script below and save.
3. Click **Deploy → New deployment**, choose **Web app**, set **Execute as: Me** and **Who has access: Anyone**, then **Deploy** and allow access. Google warns that the app isn't verified: it's your own script, so choose **Advanced → Go to the project**.
4. Copy the **Web app URL** (`https://script.google.com/macros/s/…/exec`) and paste it into unfold when it asks.

`@OnlyCurrentDoc` limits the script to this one sheet, and "Anyone" only lets the link add rows: nobody can read the sheet through it. To stop, disconnect in unfold (the settings button next to "Send to Google Sheets") or delete the deployment in Apps Script.

```js
/** @OnlyCurrentDoc */
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
