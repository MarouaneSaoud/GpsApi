const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');
const net = require('net');

const app = express();
const PORT_HTTP = 3001;
const TCP_PORT = 3002;

app.use(bodyParser.json());
app.use(cors());

mongoose.connect('mongodb://127.0.0.1:27017/numotronic_db', {
  useNewUrlParser: true,
  useUnifiedTopology: true, 
});

const configSchema = new mongoose.Schema({
  imei: {
    type: String,
    unique: true,
    required: true
  },
  fileName: String,
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
  smsPassword: String,
  version: {
    type: Number,
    default: 1
  }
}, {
  versionKey: false,
});

const Config = mongoose.model('Config', configSchema);

app.post('/config', async (req, res) => {
  const newConfig = req.body;

  try {
    const existingConfig = await Config.findOne({ imei: newConfig.imei });

    if (existingConfig) {
      newConfig.version = existingConfig.version + 1;
    }

    await Config.findOneAndUpdate({ imei: newConfig.imei }, newConfig, {
      upsert: true,
    });

    res.status(200).send('Config sending successfully');
  } catch (error) {
    console.error('Error saving config:', error);
    res.status(500).send('Error saving config');
  }
});



const tcpServer = net.createServer((socket) => {
  socket.on('data', async (data) => {
    const imei = data.toString().trim();

    try {
      const config = await Config.findOne({ imei });

      if (config) {
        const order = [
          'serverIp',
          'port',
          'apn',
          'smsResponse',
          'mode',
          'pStop',
          'sendingInterval',
          'angle',
          'sdm',
          'wifiPassword',
          'smsPassword',
          'version',
          'fileName'
        ];

        const orderedConfig = {};
        order.forEach((key) => {
          orderedConfig[key] = config._doc[key];
        });

        const configString = Object.values(orderedConfig).join(',');
        const finalConfigString = `#${configString}#`;
        socket.write(finalConfigString);
      } else {
        socket.write('Config not found');
      }
    } catch (error) {
      console.error('Error getting config:', error);
      socket.write('Error getting config');
    }
  });
});
app.get('/config/:imei', async (req, res) => {
  const imei = req.params.imei;

  try {
    const config = await Config.findOne({ imei });

    if (config) {
      const order = [
        'serverIp',
        'port',
        'apn',
        'smsResponse',
        'mode',
        'pStop',
        'sendingInterval',
        'angle',
        'sdm',
        'wifiPassword',
        'smsPassword',
        'version',
        'fileName'
      ];

      const orderedConfig = {};
      order.forEach((key) => {
        orderedConfig[key] = config._doc[key];
      });

      const configString = Object.values(orderedConfig).join(',');
      const finalConfigString = `#${configString}#`;
      res.status(200).send(finalConfigString);
    } else {
      res.status(404).send('Config not found');
    }
  } catch (error) {
    console.error('Error getting config:', error);
    res.status(500).send('Error getting config');
  }
});


app.get('/configs', async (req, res) => {
  try {
    const configs = await Config.find();

    if (configs.length > 0) {
      const configsWithoutIds = configs.map(config => {
        const { _id, ...configWithoutId } = config._doc;
        return configWithoutId;
      });

      res.status(200).json(configsWithoutIds);
    } else {
      res.status(404).send('No configs found');
    }
  } catch (error) {
    console.error('Error getting configs:', error);
    res.status(500).send('Error getting configs');
  }
});


tcpServer.listen(TCP_PORT, () => {
  console.log(`TCP Server is running on port ${TCP_PORT}`);
});

app.listen(PORT_HTTP, () => {
  console.log(`HTTP Server is running on port ${PORT_HTTP}`);
});


