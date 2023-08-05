const net = require('net');

const TCP_PORT = 8090; // Port sur lequel le serveur écoute
const GPS_UPDATE_INTERVAL = 5000; // Intervalle en millisecondes pour mettre à jour les données GPS

const client = new net.Socket();
client.connect(TCP_PORT, 'localhost', () => {
  console.log('Connecté au serveur TCP');

  // Fonction pour envoyer les données GPS
  function sendGPSData() {
    const gpsData = {
      imei: "2147483647",
      firmware: "03.27.13Rev03",
      config: "conf",
      lastSeen: getCurrentDateTime()
    };

    const jsonData = JSON.stringify(gpsData);
    client.write(jsonData);
  }

  // Mettre à jour les données GPS périodiquement
  setInterval(sendGPSData, GPS_UPDATE_INTERVAL);
});

client.on('data', (data) => {
  console.log('Réponse du serveur :', data.toString());
});

client.on('close', () => {
  console.log('Déconnecté du serveur TCP');
});

client.on('error', (err) => {
  console.error('Erreur survenue :', err);
});

// Fonction utilitaire pour obtenir la date et l'heure actuelles au format "dd-mm-yyyy-hh-mm"
function getCurrentDateTime() {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');

  return `${day}-${month}-${year}-${hours}-${minutes}`;
}
