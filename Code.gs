/**
 * OCEFAMI — Remplacement de Formspree, sans limite de soumissions.
 *
 * Reçoit les soumissions de n'importe lequel de vos formulaires
 * (inscription, présence, quiz, témoignages...) et les range
 * automatiquement dans un onglet dédié de cette feuille Google Sheets,
 * selon le champ "_subject" envoyé par chaque formulaire.
 *
 * INSTALLATION :
 * 1. Ouvrez Google Sheets, créez une nouvelle feuille (n'importe quel nom).
 * 2. Menu Extensions -> Apps Script.
 * 3. Effacez le contenu par défaut, collez tout ce fichier.
 * 4. Cliquez sur Déployer -> Nouveau déploiement.
 * 5. Type : "Application Web".
 * 6. Exécuter en tant que : Moi.
 * 7. Qui a accès : "Tout le monde" (indispensable, sinon les formulaires
 *    publics ne pourront pas envoyer de données).
 * 8. Cliquez Déployer, autorisez les permissions demandées par Google.
 * 9. Copiez l'URL "Application Web" fournie à la fin — c'est cette URL
 *    qui remplace https://formspree.io/f/mbdnngyv dans vos pages HTML.
 *
 * Si vous modifiez ce script plus tard, il faut créer un NOUVEAU
 * déploiement (Déployer -> Gérer les déploiements -> crayon -> Nouvelle
 * version) pour que les changements soient pris en compte.
 */

// ID de la feuille Google Sheets où écrire (trouvé dans son URL,
// entre /d/ et /edit). Fixé explicitement : fonctionne même si ce script
// n'a pas été créé depuis l'intérieur de cette feuille.
var SPREADSHEET_ID = '1gYHgTvKDjxbVW1cFuUtyKzGp0n1xQWo-UfEZErPxqx0';

function doPost(e) {
  try {
    var params = e.parameter; // tous les champs du formulaire (sauf fichiers)
    var subject = params['_subject'] || 'Sans titre';

    // Un onglet par type de formulaire, nommé d'après le sujet (nettoyé)
    var sheetName = subject.substring(0, 95).replace(/[\[\]\*\/\\\?:]/g, '-');

    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName(sheetName);

    var keys = Object.keys(params).filter(function (k) {
      return k !== '_subject';
    });

    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      var headers = ['Horodatage'].concat(keys);
      sheet.appendRow(headers);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    } else {
      // S'assurer que toutes les colonnes existent déjà (sinon les ajouter)
      var existingHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      keys.forEach(function (k) {
        if (existingHeaders.indexOf(k) === -1) {
          sheet.getRange(1, existingHeaders.length + 1).setValue(k);
          existingHeaders.push(k);
        }
      });
    }

    // Reconstruire la ligne dans le bon ordre de colonnes
    var finalHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var row = finalHeaders.map(function (h) {
      if (h === 'Horodatage') return new Date();
      return params[h] !== undefined ? params[h] : '';
    });
    sheet.appendRow(row);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Petite page de test si vous ouvrez l'URL directement dans un navigateur
function doGet(e) {
  return ContentService.createTextOutput('OCEFAMI — service actif. Utilisez une requête POST depuis un formulaire.');
}
