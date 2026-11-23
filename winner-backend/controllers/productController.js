const db = require('../config/db');
const path = require('path');
const XLSX = require('xlsx');

// ------------------------------------------------------------------
// Catégories de la boutique
// ------------------------------------------------------------------
// Les familles détaillées du tarif (« Huiles hydrauliques industrielles »,
// « Huiles TP », « Graisses multi-usages »…) sont désormais conservées dans
// `description` ; `categorie` ne sert plus qu'au filtre de la boutique.
const { CATEGORIES_BOUTIQUE, CATEGORIE_DEFAUT, categorieDepuisFamille } = require('../database/migration-produits');

// Ramène une valeur saisie (formulaire ou import) à une catégorie de boutique.
// Les anciennes familles sont reclassées par leur contenu ; toute valeur
// hors liste est repliée sur la catégorie par défaut.
const normaliserCategorie = (valeur, nom) => {
  const brut = String(valeur ?? '').trim();
  if (!brut) return CATEGORIE_DEFAUT;
  if (CATEGORIES_BOUTIQUE.includes(brut)) return brut;
  return categorieDepuisFamille(brut, nom || '');
};

// ------------------------------------------------------------------
// Import en masse de produits depuis un fichier CSV ou Excel.
// ------------------------------------------------------------------

// Taille maximale d'un import (nombre de lignes de données).
const MAX_LIGNES_IMPORT = 500;

// Correspondance des en-têtes (normalisés : minuscules, sans accents,
// sans espaces/tirets) vers les champs attendus.
const ALIAS_COLONNES = {
  nom: 'nom',
  name: 'nom',
  produit: 'nom',
  designation: 'nom',
  libelle: 'nom',
  libelleproduit: 'nom',
  categorie: 'categorie',
  category: 'categorie',
  description: 'description',
  desc: 'description',
  prix: 'prix',
  price: 'prix',
  prixcdf: 'prix',
  discount: 'discount',
  remise: 'discount',
  promotion: 'discount',
  solde: 'discount',
  stock: 'stock',
  quantite: 'stock',
  qte: 'stock',
  quantity: 'stock',
  statut: 'statut',
  disponible: 'statut',
  actif: 'statut',
  etat: 'statut',
  image: 'image',
  imageproduit: 'image',
  urlimage: 'image',
  imageurl: 'image'
};

const normaliserCle = (valeur) => String(valeur ?? '')
  .replace(/^\ufeff/, '') // BOM résiduel
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[\s_\-./]+/g, '');

// Indique si un buffer est un texte UTF-8 valide (sinon, on suppose un
// export Windows-1252, typique des anciens Excel français).
const estUtf8 = (buffer) => {
  try {
    new TextDecoder('utf-8', { fatal: true }).decode(buffer);
    return true;
  } catch {
    return false;
  }
};

// Extrait un nombre d'une cellule : accepte "45000", "45 000", "45,50",
// "45.5", ou un vrai nombre issu d'Excel.
const parseNombre = (valeur) => {
  if (typeof valeur === 'number' && Number.isFinite(valeur)) return valeur;
  const brut = String(valeur ?? '').trim();
  if (!brut) return null;
  const nettoye = brut.replace(/\s/g, '').replace(',', '.');
  const correspondance = nettoye.match(/-?\d+(?:\.\d+)?/);
  if (!correspondance) return null;
  const n = Number(correspondance[0]);
  return Number.isFinite(n) ? n : null;
};

// Convertit une cellule "statut/disponible" en état base ('actif'/'inactif').
const parseStatut = (valeur) => {
  const brut = String(valeur ?? '').trim().toLowerCase();
  if (!brut) return 'actif';
  return ['inactif', 'non', 'false', '0', 'rupture', 'hors stock', 'masqué', 'cache']
    .includes(brut) ? 'inactif' : 'actif';
};

// Import depuis un fichier CSV ou Excel déjà téléversé (req.file).
exports.importProducts = async (req, res) => {
  try {
    if (!req.file || !req.file.buffer || req.file.buffer.length === 0) {
      return res.status(400).json({ error: 'Aucun fichier fourni. Téléversez un fichier CSV ou Excel.' });
    }

    const extension = path.extname(req.file.originalname || '').toLowerCase();
    let classeur;
    try {
      // Les classeurs Excel (.xls/.xlsx) sont binaires : pas de souci
      // d'encodage. Les CSV, eux, sont souvent exportés en UTF-8 (Excel
      // récent, LibreOffice, Google Sheets) ou en Windows-1252 (ancien
      // Excel fr) : on détecte l'UTF-8 valide, sinon on part sur 1252.
      const optionsLecture = { type: 'buffer' };
      let contenu = req.file.buffer;
      if (extension === '.csv') {
        // Retire le BOM UTF-8 éventuel (sinon il pollue la première en-tête).
        if (contenu.length >= 3 && contenu[0] === 0xEF && contenu[1] === 0xBB && contenu[2] === 0xBF) {
          contenu = contenu.subarray(3);
        }
        optionsLecture.codepage = estUtf8(contenu) ? 65001 : 1252;
      }
      classeur = XLSX.read(contenu, optionsLecture);
    } catch {
      return res.status(400).json({ error: 'Fichier illisible. Fournissez un CSV ou un classeur Excel valide (.csv, .xls, .xlsx).' });
    }

    const nomFeuille = classeur.SheetNames[0];
    if (!nomFeuille) {
      return res.status(400).json({ error: 'Le fichier ne contient aucune feuille.' });
    }

    const lignes = XLSX.utils.sheet_to_json(classeur.Sheets[nomFeuille], { defval: '' });
    if (lignes.length === 0) {
      return res.status(400).json({ error: 'Aucune ligne de données trouvée (la première ligne doit contenir les en-têtes).' });
    }
    if (lignes.length > MAX_LIGNES_IMPORT) {
      return res.status(400).json({ error: `Le fichier contient ${lignes.length} lignes ; la limite est de ${MAX_LIGNES_IMPORT} par import.` });
    }

    const userId = req.user ? req.user.id : null;
    const resultat = { importes: 0, erreurs: [] };

    for (let i = 0; i < lignes.length; i++) {
      const numeroLigne = i + 2; // la ligne 1 du fichier contient les en-têtes
      const brut = lignes[i];

      // Regroupe les cellules de la ligne selon les alias de colonnes.
      const cellules = {};
      for (const [colonne, valeur] of Object.entries(brut)) {
        const champ = ALIAS_COLONNES[normaliserCle(colonne)];
        if (champ && cellules[champ] === undefined) cellules[champ] = valeur;
      }

      const nom = String(cellules.nom ?? '').trim();
      if (!nom) {
        resultat.erreurs.push({ ligne: numeroLigne, erreur: 'Nom du produit manquant.' });
        continue;
      }

      const prix = parseNombre(cellules.prix);
      if (prix === null || prix < 0) {
        resultat.erreurs.push({ ligne: numeroLigne, erreur: `Prix invalide ou manquant pour « ${nom} ».` });
        continue;
      }

      let discount = parseNombre(cellules.discount) ?? 0;
      discount = Math.trunc(discount);
      if (discount < 0 || discount > 100) {
        resultat.erreurs.push({ ligne: numeroLigne, erreur: `Remise invalide pour « ${nom} » (attendu : 0 à 100).` });
        continue;
      }

      let stock = parseNombre(cellules.stock) ?? 0;
      stock = Math.trunc(stock);
      if (stock < 0) {
        resultat.erreurs.push({ ligne: numeroLigne, erreur: `Stock invalide pour « ${nom} ».` });
        continue;
      }

      // La description du produit est le contenu de la colonne « categorie »
      // (2e colonne du fichier) : c'est la famille détaillée du tarif. La
      // colonne « description » ne sert que de repli si la 2e est vide.
      const famille = String(cellules.categorie ?? '').trim();
      const categorie = normaliserCategorie(famille, nom);
      const description = famille || String(cellules.description ?? '').trim();
      const statut = parseStatut(cellules.statut);
      let image = String(cellules.image ?? '').trim();
      if (!image) image = '/prod.webp';

      await db.query(
        `INSERT INTO produits (nom, categorie, description, prix, discount, en_solde, stock, statut, image_produit, user_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [nom, categorie, description, prix, discount, discount > 0 ? 1 : 0, stock, statut, image, userId]
      );
      resultat.importes += 1;
    }

    return res.status(resultat.importes > 0 ? 201 : 400).json({
      message: resultat.importes > 0
        ? `${resultat.importes} produit(s) importé(s) avec succès.`
        : 'Aucun produit n’a pu être importé.',
      ...resultat
    });
  } catch (error) {
    console.error("Erreur lors de l'import des produits :", error);
    res.status(500).json({ error: 'Erreur serveur lors de l’import.' });
  }
};

// Modèle CSV téléchargeable : reprend exactement les colonnes attendues.
exports.modeleImport = (_req, res) => {
  const entetes = ['nom', 'categorie', 'description', 'prix', 'discount', 'stock', 'statut', 'image'];
  const exemple = [
    'Huile Moteur 5W30',
    'Lubrifiants',
    'Huile de synthèse 5W30, bidon 4L',
    '45000',
    '10',
    '25',
    'actif',
    ''
  ];
  const csv = [entetes.join(';'), exemple.join(';')].join('\r\n') + '\r\n';
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="modele-import-produits.csv"');
  res.send(csv);
};

// 1. Récupérer les produits (GET)
// - Visiteur anonyme : uniquement les produits actifs (visibles en boutique)
// - Personnel connecté (Admin ou Modérateur) : tous les produits
//   (le modérateur les consulte en lecture seule)
exports.getAllProducts = async (req, res) => {
  try {
    const estAdmin = req.user && (req.user.role === 'Admin' || req.user.role === 'Modérateur');
    // Note moyenne + nombre d'avis par produit (affichés en boutique)
    const selectAvis = `SELECT p.*,
      (SELECT ROUND(AVG(a.note), 1) FROM avis_produits a WHERE a.produit_id = p.id) AS note_moyenne,
      (SELECT COUNT(*) FROM avis_produits a WHERE a.produit_id = p.id) AS nb_avis
      FROM produits p`;
    const [produits] = estAdmin
      ? await db.query(`${selectAvis} ORDER BY p.created_at DESC`)
      : await db.query(`${selectAvis} WHERE p.statut = 'actif' ORDER BY p.created_at DESC`);
    
    const formattedProduits = produits.map(p => ({
      id: p.id,
      nom: p.nom,
      categorie: normaliserCategorie(p.categorie, p.nom),
      description: p.description || '',
      prix: parseFloat(p.prix),
      discount: p.discount || 0,
      enSolde: Boolean(p.en_solde || p.discount > 0),
      stock: p.stock || 0,
      disponible: p.statut === 'actif',
      statut: p.statut,
      image: p.image_produit || '/prod.webp',
      noteMoyenne: parseFloat(p.note_moyenne) || 0,
      nbAvis: parseInt(p.nb_avis, 10) || 0,
      created_at: p.created_at
    }));

    res.json(formattedProduits);
  } catch (error) {
    console.error("Erreur lors de la récupération des produits :", error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération.' });
  }
};

// 2. Créer un nouveau produit (POST)
exports.createProduct = async (req, res) => {
  try {
    const { nom, categorie, prix, discount, stock, description, disponible } = req.body;
    const userId = req.user ? req.user.id : 1; 

    const statut = (disponible === 'false' || disponible === false) ? 'inactif' : 'actif';
    const discountVal = parseInt(discount) || 0;
    const enSoldeVal = discountVal > 0 ? 1 : 0;
    const catVal = normaliserCategorie(categorie, nom);
    // La description doit reprendre la catégorie saisie quand elle est vide.
    const familleSaisie = String(categorie ?? '').trim();
    const descVal = description || familleSaisie;
    
    // Si un fichier a été uploadé via Multer, on crée le chemin, sinon image par défaut
    let imgVal = '/prod.webp';
    if (req.file) {
      // Ajustez le chemin de l'image selon la configuration de votre serveur (ex: dossier 'public/uploads')
      imgVal = `/uploads/${req.file.filename}`;
    }

    const [result] = await db.query(
      `INSERT INTO produits (nom, categorie, description, prix, discount, en_solde, stock, statut, image_produit, user_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [nom, catVal, descVal, parseFloat(prix), discountVal, enSoldeVal, parseInt(stock) || 0, statut, imgVal, userId]
    );

    res.status(201).json({ message: 'Produit créé avec succès', id: result.insertId });
  } catch (error) {
    console.error("Erreur lors de la création du produit :", error);
    res.status(500).json({ error: 'Erreur serveur lors de la création.' });
  }
};

// 3. Mettre à jour un produit (PUT)
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;

    // Cas A : Modification rapide via le Switch ON/OFF (Requête JSON sans fichier)
    if (body.disponible !== undefined && Object.keys(body).length === 1) {
      const nouveauStatut = body.disponible ? 'actif' : 'inactif';
      await db.query('UPDATE produits SET statut = ? WHERE id = ?', [nouveauStatut, id]);
      return res.json({ message: 'Statut mis à jour.' });
    }

    // Cas B : Modification complète via la Modale (Requête FormData)
    const { nom, categorie, prix, discount, stock, description } = body;
    
    const catVal = normaliserCategorie(categorie, nom);
    const familleSaisie = String(categorie ?? '').trim();
    const descVal = description || familleSaisie;

    let updateFields = 'nom = ?, categorie = ?, description = ?, prix = ?, discount = ?, en_solde = ?, stock = ?';
    const params = [nom, catVal, descVal, parseFloat(prix), parseInt(discount) || 0, (parseInt(discount) || 0) > 0 ? 1 : 0, parseInt(stock) || 0];

    // Si une nouvelle image a été envoyée, on l'ajoute à la mise à jour
    if (req.file) {
      updateFields += ', image_produit = ?';
      params.push(`/uploads/${req.file.filename}`);
    }

    params.push(id);

    await db.query(`UPDATE produits SET ${updateFields} WHERE id = ?`, params);

    res.json({ message: 'Produit mis à jour avec succès.' });
  } catch (error) {
    console.error("Erreur lors de la modification :", error);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
};

// 4. Supprimer un produit (DELETE)
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM produits WHERE id = ?', [id]);
    res.json({ message: 'Produit supprimé avec succès.' });
  } catch (error) {
    console.error("Erreur lors de la suppression :", error);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
};