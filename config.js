const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = 3001;

app.use(bodyParser.json());
app.use(cors());

mongoose.connect('mongodb://localhost:27017/numotronic_db', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const configSchema = new mongoose.Schema({
  imei: {
    type: String,
    unique: true,
    required: true
  },
  serverIp: String,
  port: Number,
  apn: String,
  smsResponse: Number,
  mode: Number,
  pStop: Number,
  sendingInterval: Number,
  angle: Number,
  sdm: Number,
  wifiPassword: String,
  smsPassword: String
}, {
  versionKey: false,
});


const Config = mongoose.model('Config', configSchema);

app.post('/config', async (req, res) => {
  const newConfig = req.body;

  try {
    await Config.findOneAndUpdate({ imei: newConfig.imei }, newConfig, {
      upsert: true,
    });

    res.status(200).send('Config sending successfully');
  } catch (error) {
    console.error('Error saving config:', error);
    res.status(500).send('Error saving config');
  }
});

app.get('/config/:imei', async (req, res) => {
  const imei = req.params.imei;

  try {
    const config = await Config.findOne({ imei });

    if (config) {
      const { _id, ...configWithoutId } = config._doc;
      res.status(200).json(configWithoutId);
    } else {
      res.status(404).send('Config not found');
    }
  } catch (error) {
    console.error('Error getting config:', error);
    res.status(500).send('Error getting config');
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
