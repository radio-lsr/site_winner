/**
 * Migration des produits : catégories de boutique + transfert dans description.
 *
 * Contexte : la colonne `description` de `produits` était jusque-là laissée vide,
 * et c'est la colonne `categorie` qui portait les familles détaillées du tarif
 * (ex. « Huiles hydrauliques industrielles », « Huiles TP », « Graisses
 * multi-usages », « Produits entretien automobiles »).
 *
 * La boutique n'affiche plus que trois catégories :
 *   Lubrifiants · Produits d'entretien · Accessoires
 *
 * Cette migration, idempotente, applique deux changements :
 *   1. recopie la famille détaillée dans `description` pour tout produit dont
 *      la description est vide ou ne contenait qu'un code article (le code
 *      article seul n'a pas de valeur commerciale) ;
 *   2. réaffecte `categorie` selon le contenu de l'ancienne famille.
 *
 * Elle fonctionne sur les deux moteurs supportés (MySQL par défaut,
 * SQLite avec DB_ENGINE=sqlite) et est jouée automatiquement au démarrage
 * de l'API ; `npm run db:init` l'exécute aussi.
 *
 * Le même point d'entrée ajoute aussi les colonnes manquantes de `commandes`
 * (`client_email`, `mode_retrait`) — voir appliquerMigrationCommandes.
 */

// Familles du tarif dont les produits sont des lubrifiants.
const FAMILLES_LUBRIFIANTS = [
  'huile',
  'graisse',
  'lubrifi',
  'quartz',
  'rubia',
  'azolla',
  'finavest',
  'fluid',
  'transmission',
  'moteur',
  'turbine',
  'compresseur',
  'engrenage',
  'hydraulique'
];

// Familles du tarif correspondant à des opérations d'entretien / nettoyage.
const FAMILLES_ENTRETIEN = [
  'entretien',
  'nettoyage',
  'nettoyant',
  'dégraissant',
  'degraissant',
  'additif',
  'refroidissement',
  'coolelf',
  'refrigerant'
];

const CATEGORIES_BOUTIQUE = ['Lubrifiants', "Produits d'entretien", 'Accessoires'];
const CATEGORIE_DEFAUT = 'Lubrifiants';

// Clé normalisée : minuscules, sans accents, espaces et tirets réduits.
const normaliser = (valeur) => String(valeur ?? '')
  .normalize('NFD')
  .replace(/[̀-ͯ]/g, '')
  .toLowerCase()
  .replace(/[\s_\-./]+/g, ' ')
  .trim();

const contient = (texte, fragments) => fragments.some(fragment => texte.includes(fragment));

/**
 * Devine la catégorie de boutique d'un produit à partir de l'ancienne
 * famille détaillée (ou du nom si la famille est absente).
 */
const categorieDepuisFamille = (famille, nom) => {
  const texte = normaliser(`${famille} ${nom}`);
  if (contient(texte, FAMILLES_ENTRETIEN)) return "Produits d'entretien";
  if (contient(texte, FAMILLES_LUBRIFIANTS)) return 'Lubrifiants';
  return CATEGORIE_DEFAUT;
};

/** Extraît un texte (MySQL et SQLite renvoient tous deux des chaînes). */
const texte = (valeur) => (valeur === null || valeur === undefined ? '' : String(valeur));

// Le SQLite natif renvoie des colonnes { name }, MySQL des colonnes { Field }.
const nomColonne = (colonne) => colonne.name || colonne.Field;

// Une description « Code article 12345 - Famille » ne sert à rien en boutique :
// on la remplace par la famille seule.
const nEstQueCodeArticle = (valeur) => {
  const brut = String(valeur ?? '').trim();
  if (brut === '') return true;
  return /^\s*code\s*article\b/i.test(brut);
};

/**
 * Applique la migration sur un moteur déjà connecté.
 * `listerColonnes` doit retourner la liste des colonnes de `produits`.
 */
const migrer = async (db, listerColonnes) => {
  const nomsColonnes = new Set((await listerColonnes(db)).map(nomColonne));
  if (!nomsColonnes.has('description') || !nomsColonnes.has('categorie')) {
    return { transferees: 0, reclassifies: 0, categories: CATEGORIES_BOUTIQUE };
  }

  const [produits] = await db.query('SELECT id, nom, categorie, description FROM produits');
  let transferees = 0;
  let reclassifies = 0;

  const executer = async () => {
    for (const produit of produits) {
      const famille = texte(produit.categorie).trim();
      const descriptionActuelle = texte(produit.description).trim();
      const nom = texte(produit.nom);

      // 1. La famille détaillée devient la description, une seule fois et
      //    jamais par-dessus une description saisie par l'administrateur.
      //    On ne fait rien si la catégorie est déjà une catégorie de boutique
      //    (Lubrifiants / Produits d'entretien / Accessoires) : il n'y a pas de
      //    famille à récupérer.
      const familleEstUneCategorieBoutique = CATEGORIES_BOUTIQUE.includes(famille);
      if (!familleEstUneCategorieBoutique && famille !== ''
          && (descriptionActuelle === '' || nEstQueCodeArticle(descriptionActuelle))) {
        await db.query('UPDATE produits SET description = ? WHERE id = ?', [famille, produit.id]);
        transferees += 1;
      }

      // 2. On ne réaffecte que les anciennes familles détaillées : un produit
      //    déjà classé dans une catégorie de boutique est laissé en l'état.
      if (CATEGORIES_BOUTIQUE.includes(famille)) continue;
      const nouvelleCategorie = categorieDepuisFamille(famille, nom);
      await db.query('UPDATE produits SET categorie = ? WHERE id = ?', [nouvelleCategorie, produit.id]);
      reclassifies += 1;
    }
  };

  if (typeof db.getConnection === 'function') {
    // MySQL : une seule transaction, pour qu'un plantage ne laisse pas la
    // base à moitié migrée.
    await db.query('START TRANSACTION');
    try {
      await executer();
      await db.query('COMMIT');
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  } else {
    await executer();
  }

  return { transferees, reclassifies, categories: CATEGORIES_BOUTIQUE };
};

/**
 * Crée la colonne `code` (référence unique) si elle manque, puis donne à
 * chaque produit existant la référence PRD-0001, PRD-0002… dérivée de son id.
 */
const appliquerMigrationCode = async (db) => {
  const estMysql = typeof db.getConnection === 'function';
  const [colonnes] = await db.query(estMysql ? 'SHOW COLUMNS FROM produits' : 'PRAGMA table_info(produits)');
  const noms = new Set(colonnes.map(c => c.Field || c.name));

  if (!noms.has('code')) {
    await db.query(estMysql
      ? 'ALTER TABLE produits ADD COLUMN code VARCHAR(50) DEFAULT NULL'
      : 'ALTER TABLE produits ADD COLUMN code TEXT DEFAULT NULL');
  }

  await db.query(estMysql
    ? "UPDATE produits SET code = CONCAT('PRD-', LPAD(id, 4, '0')) WHERE code IS NULL OR code = ''"
    : "UPDATE produits SET code = 'PRD-' || printf('%04d', id) WHERE code IS NULL OR code = ''");

  try {
    await db.query(estMysql
      ? 'ALTER TABLE produits ADD UNIQUE INDEX idx_produits_code (code)'
      : 'CREATE UNIQUE INDEX IF NOT EXISTS idx_produits_code ON produits(code)');
  } catch (error) {
    // Index déjà présent (ou valeurs dupliquées) : l'import gère quand même
    // la doublon en écrasant le produit existant.
  }
};

/**
 * Ajoute à `commandes` les colonnes `client_email` et `mode_retrait` lorsque la
 * base ne les possède pas encore (schéma SQLite historique incomplet par
 * rapport à schema.sql / au controller).
 */
const appliquerMigrationCommandes = async (db) => {
  const estMysql = typeof db.getConnection === 'function';
  const [colonnes] = await db.query(estMysql ? 'SHOW COLUMNS FROM commandes' : 'PRAGMA table_info(commandes)');
  const noms = new Set(colonnes.map(c => c.Field || c.name));

  if (noms.has('client_email') && noms.has('mode_retrait')) return false;

  const ajouts = [];
  if (!noms.has('client_email')) {
    ajouts.push(estMysql
      ? 'ALTER TABLE commandes ADD COLUMN client_email VARCHAR(150) DEFAULT NULL'
      : 'ALTER TABLE commandes ADD COLUMN client_email TEXT DEFAULT NULL');
  }
  if (!noms.has('mode_retrait')) {
    ajouts.push(estMysql
      ? "ALTER TABLE commandes ADD COLUMN mode_retrait ENUM('Livraison', 'Réservation') NOT NULL DEFAULT 'Livraison'"
      : "ALTER TABLE commandes ADD COLUMN mode_retrait TEXT NOT NULL DEFAULT 'Livraison'");
  }
  for (const sql of ajouts) {
    await db.query(sql);
  }
  return true;
};

/**
 * Ajoute la colonne `vedette` (produit mis en avant par l'administrateur)
 * si la base ne la possède pas encore.
 */
const appliquerMigrationVedette = async (db) => {
  const estMysql = typeof db.getConnection === 'function';
  const [colonnes] = await db.query(estMysql ? 'SHOW COLUMNS FROM produits' : 'PRAGMA table_info(produits)');
  const noms = new Set(colonnes.map(c => c.Field || c.name));

  if (noms.has('vedette')) return false;

  await db.query(estMysql
    ? 'ALTER TABLE produits ADD COLUMN vedette TINYINT(1) NOT NULL DEFAULT 0'
    : 'ALTER TABLE produits ADD COLUMN vedette INTEGER NOT NULL DEFAULT 0');
  return true;
};

const appliquerMigrationProduits = async (db) => {
  try {
    await appliquerMigrationCode(db);
    await appliquerMigrationCommandes(db);
    await appliquerMigrationVedette(db);
    const engine = (process.env.DB_ENGINE || '').toLowerCase();
    const resultat = engine === 'sqlite'
      ? await migrer(db, async () => (await db.query('PRAGMA table_info(produits)'))[0])
      : await migrer(db, async () => (await db.query('SHOW COLUMNS FROM produits'))[0]);
    if (resultat.transferees || resultat.reclassifies) {
      console.log(
        `[DB] Migration produits : ${resultat.transferees} famille(s) copiée(s) dans description, ` +
        `${resultat.reclassifies} produit(s) reclassé(s) (Lubrifiants / Produits d'entretien / Accessoires).`
      );
    }
    return resultat;
  } catch (error) {
    console.error('[DB] Migration produits ignorée :', error.message);
    return { transferees: 0, reclassifies: 0, categories: CATEGORIES_BOUTIQUE, erreur: error.message };
  }
};

module.exports = {
  appliquerMigrationProduits,
  appliquerMigrationCode,
  appliquerMigrationCommandes,
  appliquerMigrationVedette,
  categorieDepuisFamille,
  CATEGORIES_BOUTIQUE,
  CATEGORIE_DEFAUT
};
