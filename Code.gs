/**
 * Ginga Global Group — site backend, running entirely on Google Sheets.
 * Paste this whole file into Extensions > Apps Script in your Google Sheet,
 * replacing whatever is in Code.gs. See README.md for the full setup steps.
 *
 * Handles two things:
 *  - doPost: form submissions from the site (Elite Neon Cup + Contact) get
 *    appended as rows to a matching sheet tab.
 *  - doGet:  serves rows from a sheet tab as JSON, e.g. ?sheet=Blog, so the
 *    site can pull blog posts straight from a spreadsheet you edit by hand.
 */

function doPost(e) {
  try {
    var params = e.parameter;
    var formType = params.formType || 'Unknown';

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(formType);

    if (!sheet) {
      sheet = ss.insertSheet(formType);
      var headers = Object.keys(params).filter(function (k) { return k !== 'company'; });
      headers.unshift('Timestamp');
      sheet.appendRow(headers);
    }

    // honeypot field filled in = bot, silently ignore
    if (params.company) {
      return ContentService.createTextOutput(JSON.stringify({ result: 'ignored' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    var headerRow = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var row = headerRow.map(function (header) {
      if (header === 'Timestamp') return new Date();
      return params[header] || '';
    });

    sheet.appendRow(row);

    return ContentService.createTextOutput(JSON.stringify({ result: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ result: 'error', message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  var sheetName = (e.parameter && e.parameter.sheet) || null;

  if (!sheetName) {
    return ContentService.createTextOutput("Ginga Global Group form handler is running.");
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify([]))
      .setMimeType(ContentService.MimeType.JSON);
  }

  var values = sheet.getDataRange().getValues();
  var headers = values.shift();

  var rows = values
    .filter(function (row) { return row.join('') !== ''; }) // skip blank rows
    .map(function (row) {
      var obj = {};
      headers.forEach(function (header, i) {
        var val = row[i];
        // dates come back as JS Date objects from Sheets — stringify cleanly
        obj[header] = (val instanceof Date) ? Utilities.formatDate(val, Session.getScriptTimeZone(), 'yyyy-MM-dd') : val;
      });
      return obj;
    });

  return ContentService.createTextOutput(JSON.stringify(rows))
    .setMimeType(ContentService.MimeType.JSON);
}
