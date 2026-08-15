/**
 * Backend do formulário "Mapa de Expansão da Visão".
 * Implantar como Web App (Extensões > Apps Script, dentro da planilha
 * "Mapa de expansao de visao") vinculado a esta planilha.
 *
 * doPost: recebe uma resposta do formulário e adiciona uma linha.
 * doGet: devolve todas as respostas em JSON, para a aba de resultados.
 */

var SHEET_NAME = 'Página1';

function getSheet_() {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
}

function jsonOutput_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var data = JSON.parse(e.postData.contents);
    var sheet = getSheet_();
    sheet.appendRow([
      new Date().toISOString(),
      (data.nome || 'Anônimo').toString().slice(0, 200),
      JSON.stringify(data.scores || {}),
      (data.open1 || '').toString().slice(0, 5000),
      (data.open2 || '').toString().slice(0, 5000)
    ]);
    return jsonOutput_({ ok: true });
  } catch (err) {
    return jsonOutput_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  try {
    var sheet = getSheet_();
    var rows = sheet.getDataRange().getValues();
    var entries = [];
    for (var i = 1; i < rows.length; i++) {
      var row = rows[i];
      if (!row[0]) continue;
      var scores = {};
      try { scores = JSON.parse(row[2]); } catch (parseErr) { scores = {}; }
      entries.push({
        ts: row[0],
        nome: row[1],
        scores: scores,
        open1: row[3],
        open2: row[4]
      });
    }
    return jsonOutput_({ ok: true, entries: entries });
  } catch (err) {
    return jsonOutput_({ ok: false, error: String(err), entries: [] });
  }
}
