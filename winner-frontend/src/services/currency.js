// ============================================================
// Devise du site : franc congolais, code « CDF » affiché après les montants.
// ------------------------------------------------------------
// Les montants enregistrés en base sont exprimés en CDF : aucun
// taux de change ni conversion n'est appliqué à l'affichage.
// ============================================================

export const CURRENCY_CODE = 'CDF';
export const CURRENCY_SYMBOL = 'CDF';
export const CURRENCY_LABEL = 'Franc congolais (CDF)';

const formateurFr = new Intl.NumberFormat('fr-FR', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2
});

/**
 * Formate un montant en francs congolais.
 * Exemple : formatPrix(45000) -> "45 000 CDF"
 *
 * @param {number|string} montant Montant en CDF
 * @returns {string} Montant formaté suivi du code CDF
 */
export const formatPrix = (montant) => {
  const valeur = Number(montant);
  const montantFormate = formateurFr.format(Number.isFinite(valeur) ? valeur : 0);
  return `${montantFormate} ${CURRENCY_SYMBOL}`;
};
