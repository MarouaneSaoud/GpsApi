const express = require('express');
const axios = require('axios');
const fs = require('fs').promises;
const bodyParser = require('body-parser');

const app = express();
const port = 3001;

app.use(express.json());
app.get('/', async (req, res) => {
  res.send("Running ...")
});

app.get('/api/regrouped-data', async (req, res) => {
  try {
    // Lire les liens des APIs à partir du fichier apiLinks.txt
    const apiLinks = await fs.readFile('apiLinks.txt', 'utf-8');
    const linksArray = apiLinks.split('\n').filter(link => link.trim() !== '');

    if (linksArray.length === 0) {
      throw new Error('Le fichier apiLinks.txt est vide ou mal formaté.');
    }

    // Effectuer les appels aux APIs et récupérer les données
    const apiDataPromises = linksArray.map(link => axios.get(link));
    const apiResponses = await Promise.all(apiDataPromises);

    // Récupérer les données des différentes APIs et les formater
    const devicesData = apiResponses.map((response, index) => {
      const apiData = response.data;
      return {
        imei: apiData.imei,
        firmware: apiData.firware,
        config: apiData.config,
        lastSeen: apiData.lastSeen,
      };
    });

    // Regrouper les données dans l'objet JSON devices
    const regroupedData = {
      devices: devicesData,
    };

    res.json(regroupedData);
  } catch (error) {
    console.error('Erreur lors de la récupération et du regroupement des données:', error.message);
    res.status(500).json({ error: 'Erreur lors de la récupération des données' });
  }
});


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Route POST pour stocker les liens d'API dans le fichier apiLinks.txt
app.post('/api/store-links', async (req, res) => {
  try {
    const links = req.body.links; // Les liens d'API sont envoyés dans le corps de la requête POST

    if (!links || typeof links !== 'string') {
      return res.status(400).json({ error: 'Veuillez fournir une liste de liens d\'API valide sous forme de chaîne de caractères.' });
    }

    const linksArray = links.split(',').map(link => link.trim()); // Convertir la chaîne de caractères en un tableau de liens

    if (linksArray.length === 0) {
      return res.status(400).json({ error: 'Veuillez fournir au moins un lien d\'API valide.' });
    }

    // Lire les liens d'API existants dans le fichier apiLinks.txt
    const existingLinks = await fs.readFile('apiLinks.txt', 'utf-8');
    const existingLinksArray = existingLinks.split('\n').map(link => link.trim());

    // Filtrer les nouveaux liens qui ne sont pas déjà dans le fichier
    const newLinksArray = linksArray.filter(link => !existingLinksArray.includes(link));

    if (newLinksArray.length === 0) {
      return res.json({ message: 'Aucun nouveau lien à enregistrer.' });
    }

    // Créer un texte avec les nouveaux liens séparés par une nouvelle ligne
    const newLinksText = newLinksArray.join('\n');

    // Ajouter les nouveaux liens dans le fichier apiLinks.txt
    await fs.appendFile('apiLinks.txt', '\n' + newLinksText, 'utf-8');

    res.json({ message: 'Les nouveaux liens d\'API ont été enregistrés avec succès.' });
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement des liens d\'API:', error.message);
    res.status(500).json({ error: 'Erreur lors de l\'enregistrement des liens d\'API.' });
  }
});


app.listen(port, () => {
  console.log(`Le serveur est en cours d'exécution sur http://localhost:${port}`);
});
















