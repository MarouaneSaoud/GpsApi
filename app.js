const net = require('net');
const express = require('express');
const http = require('http');
const fs = require('fs'); // Ajout du module fs pour travailler avec les fichiers

let devicesData = { devices: [] };
const app = express();
const portTCP = 8080;
const portHTTP = 3000;
/*
const allowedIP = '192.168.1.147'; // Remplacez par l'adresse IP autorisée

// Middleware pour vérifier l'adresse IP avant chaque requête
app.use((req, res, next) => {
  const clientIP = req.ip; // Récupère l'adresse IP du client
  if (clientIP !== allowedIP) {
    // Si l'adresse IP du client ne correspond pas à l'adresse IP autorisée
    return res.status(403).send('Accès interdit.'); // Répond avec une erreur 403 (Accès interdit)
  }
  next(); // Si l'adresse IP est autorisée, passez à la suite du traitement
});
*/

// Fonction pour charger les données à partir du fichier s'il existe
function loadDevicesDataFromFile() {
  fs.readFile('devices.json', 'utf8', (err, data) => {
    if (!err) {
      devicesData = JSON.parse(data);
    }
  });
}

// Charger les données au démarrage du serveur
loadDevicesDataFromFile();

app.use(express.json());

app.get('/devices', (req, res) => {
  console.log('Requête GET reçue.');
  res.json(devicesData);
});

const tcpServer = net.createServer(socket => {
  socket.on('data', data => {
    try {
      const receivedData = JSON.parse(data.toString());
      console.log('Données reçues via TCP:', receivedData);

      const index = devicesData.devices.findIndex(device => device.imei === receivedData.imei);

      if (index !== -1) {
        devicesData.devices[index] = {
          imei: receivedData.imei,
          firmware: receivedData.firmware,
          config: receivedData.config,
          lastSeen: receivedData.lastSeen,
        };
      } else {
        devicesData.devices.push({
          imei: receivedData.imei,
          firmware: receivedData.firmware,
          config: receivedData.config,
          lastSeen: receivedData.lastSeen,
        });
      }

      console.log('Données rassemblées :', devicesData);

      // Enregistrez les données dans le fichier
      fs.writeFile('devices.json', JSON.stringify(devicesData), 'utf8', err => {
        if (err) {
          console.error('Erreur lors de l\'enregistrement des données dans le fichier:', err);
        } else {
          console.log('Données enregistrées dans le fichier.');
        }
      });
    } catch (error) {
      console.error('Erreur de traitement des données :', error.message);
    }
  });

  socket.on('end', () => {
    console.log('Client déconnecté.');
  });

  socket.on('error', err => {
    console.error('Erreur de connexion:', err.message);
  });
});

tcpServer.listen(portTCP, () => {
  console.log(`Serveur TCP en écoute sur le port ${portTCP}`);
});

const httpServer = app.listen(portHTTP, () => {
  console.log(`Serveur HTTP en écoute sur le port ${portHTTP}`);
});
/*
process.on('SIGINT', () => {
  console.log('Arrêt de l\'application. Sauvegarde des données...');
  // Videz les données du tableau avant de les enregistrer dans le fichier
  devicesData.devices = [];
  // Enregistrez les données dans le fichier avant de quitter le processus
  fs.writeFile('devices.json', JSON.stringify(devicesData), 'utf8', err => {
    if (err) {
      console.error('Erreur lors de l\'enregistrement des données dans le fichier:', err);
    } else {
      console.log('Données enregistrées dans le fichier. Arrêt de l\'application.');
      process.exit(0); // Quittez le processus avec un code de sortie 0 (sans erreur)
    }
  });
});*/
