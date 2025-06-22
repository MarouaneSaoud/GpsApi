const net = require('net');
const TCP_PORT = 3002; 
const GPS_IMEI = '86556064862452'; 

const client = new net.Socket();

client.connect(TCP_PORT, '127.0.0.1', () => {
  console.log('Simulated GPS connected to server');
  client.write(GPS_IMEI);
});

client.on('data', (data) => {

  const configString = data.toString();
  console.log('Received configuration from server:', configString);
  client.end();
});

client.on('close', () => {
  console.log('Simulated GPS connection closed');
});
