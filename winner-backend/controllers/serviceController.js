const db = require('../config/db');

// Lister tous les services
exports.getAllServices = async (req, res) => {
  try {
    const [services] = await db.query('SELECT * FROM services ORDER BY created_at DESC');
    res.json(services);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la récupération des services.' });
  }
};

// Créer un service
exports.createService = async (req, res) => {
  try {
    const { titre, description, prix, statut } = req.body;

    if (!titre || !prix) {
      return res.status(400).json({ error: 'Le titre et le prix sont obligatoires.' });
    }

    await db.query(
      'INSERT INTO services (titre, description, prix, statut) VALUES (?, ?, ?, ?)',
      [titre, description || '', prix, statut || 'actif']
    );

    res.status(201).json({ message: 'Service créé avec succès.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la création du service.' });
  }
};

// Supprimer un service
exports.deleteService = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await db.query('DELETE FROM services WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Service non trouvé.' });
    }

    res.json({ message: 'Service supprimé avec succès.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la suppression du service.' });
  }
};