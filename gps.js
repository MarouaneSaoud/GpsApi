const net = require("net");
const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const { Schema } = mongoose;

const app = express();
const portTCP = 10200;
const portHTTP = 3000;

// Définissez le schéma de données pour les périphériques
const deviceSchema = new Schema({
  imei: String,
  firmware: String,
  config: Object,
  lastSeen: Date,
}, {
  versionKey: false,
  _id: false
});

// Connexion à la base de données MongoDB
mongoose.connect("mongodb://localhost:27017/numotronic_db", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const Device = mongoose.model("Device", deviceSchema);

app.use(express.json());

app.get("/devices", async (req, res) => {
  console.log("Requête GET reçue.");
  try {
    const devices = await Device.find();
    const devicesObject = { devices };
    res.json(devicesObject);
  } catch (error) {
    res.status(500).json({ error: "Une erreur est survenue lors de la récupération des périphériques." });
  }
});

const tcpServer = net.createServer((socket) => {
  socket.on("data", async (data) => {
    try {
      const receivedData = JSON.parse(data.toString());
      console.log("Données reçues via TCP:", receivedData);

      const existingDevice = await Device.findOne({ imei: receivedData.imei });

      if (existingDevice) {
        existingDevice.firmware = receivedData.firmware;
        existingDevice.config = receivedData.config;
        existingDevice.lastSeen = receivedData.lastSeen;
        await existingDevice.save();
      } else {
        const newDevice = new Device({
          imei: receivedData.imei,
          firmware: receivedData.firmware,
          config: receivedData.config,
          lastSeen: receivedData.lastSeen,
        });
        await newDevice.save();
      }

    } catch (error) {
      console.error("Erreur de traitement des données :", error.message);
    }
  });

  socket.on("end", () => {
    console.log("Client déconnecté.");
  });

  socket.on("error", (err) => {
    console.error("Erreur de connexion:", err.message);
  });
});

tcpServer.listen(portTCP, () => {
  console.log(`Serveur TCP en écoute sur le port ${portTCP}`);
});

const httpServer = app.listen(portHTTP, () => {
  console.log(`Serveur HTTP en écoute sur le port ${portHTTP}`);
});


/*const allowedIP = '192.168.1.147'; // Remplacez par l'adresse IP autorisée
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