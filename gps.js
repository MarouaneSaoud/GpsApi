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
  lastSeen: String,
}, {
  versionKey: false,
});

// Connexion à la base de données MongoDB
mongoose.connect("mongodb://127.0.0.1:27017/numotronic_db", {
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
