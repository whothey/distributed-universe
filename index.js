const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const moment = require('moment');
const Planet = require('./src/planet');
const pkg = require('./package.json');
const VectorClock = require('./src/vector-clock');
const { reliableMulticast, reliableReceive } = require('./src/reliable');

const PORT = process.env.PORT || 3000;
const ME = `localhost:${PORT}`;

const PEER_DISCOVER_INTERVAL = 10 * 1000; // 10 secs

const peers = new Set(process.argv.slice(2));
let state = moment();
const app = express();

const multicast = reliableMulticast(peers);
const receive = reliableReceive;

const vectorClock = new VectorClock(ME);

console.log('Initial peers:', peers);

app.use(bodyParser.json());
app.use(cors());

const PlanetService = {
  // Force first planet to be 1
  list: [new Planet('Base')],
};

app.get('/', (req, res) => {
  const { name, version } = pkg;

  res.json({ app: name, version });
});

app.post('/peers', (req, res) => {
  const { sender } = req.body;

  console.log(`Peers gathered by ${sender}`);

  if (sender !== ME) {
    peers.add(sender);
  }

  res.json({ peers: [...peers] });
});

app.get('/', (req, res) => {
  res.json({ message: 'Hi there!' });
});

app.get('/peers', (req, res) => {
  res.json({ peers: [...peers.values()] });
});

app.post('/sync/planets', reliableReceive);
app.get('/sync/planets', (req, res) => {
  console.log(`Syncing with ${req.hostname} [${req.ip}]`);

  res.json({
    planets: PlanetService.list.map(p => p.dumpJson()),
  });
});

app.get('/state', (req, res) => {
  res.json({
    vectorClock: vectorClock.serialize(),
    state: +state,
    planets: PlanetService.list.map(p => p.dumpJson()),
  });
});

app.get('/planets', (req, res) => {
  res.json({ planets: PlanetService.list.map(p => p.toJson()) });
});

app.post('/planets', (req, res) => {
  const { name } = req.body;

  const newid = PlanetService.list.length;

  const planet = new Planet(name, state);

  console.log(`Created planet ${newid}: ${planet.name}`);
  PlanetService.list.push(planet);

  vectorClock.increment();

  res.json({ message: 'OK!', planet_id: newid });
});

app.post('/timewarp', (req, res) => {
  const { time } = req.body;

  console.log(`Time Warping: ${time} ${Planet.STAMINA_UPDATE_FREQ}`);
  state.add(time, Planet.STAMINA_UPDATE_FREQ);

  PlanetService.list.map(p => p.processq(state));

  vectorClock.increment();

  res.json({ message: 'OK!', newtime: +state });
});

app.get('/planets/:planetid', (req, res) => {
  const planet = PlanetService.list[req.params.planetid].toJson(state);

  res.json({ planet });
});

app.get('/planets/:planetid/q', (req, res) => {
  const q = PlanetService.list[req.params.planetid].qToJson();

  res.json({ q });
});

app.post('/planets/:planetid/build/:build', (req, res) => {
  const { planetid, build } = req.params;

  const planet = PlanetService.list[planetid];

  try {
    planet.build(build, state);
    vectorClock.increment();
    res.json({ status: 'building', building: build });
  } catch (e) {
    res.json({
      status: 'error',
      error: e,
    });
  }
});

// For each peer received, add to peers map.
const joinPeers = ps => ps.forEach(p => (p !== ME ? peers.add(p) : false));

// Destructure response body to peers and apply to joinPeers
const receivePeers = proms => proms.map(
  receive(({ peers: newPeers = [] } = {}) => joinPeers(newPeers)),
);

// Destructure response body to peers and apply to joinPeers
const applyState = receive(({ vectorClock: v, state: s, planets } = {}) => {
  console.log('state received:', { vectorClock: v, state: s, planets });

  if (v) vectorClock.replace(v);
  if (s) state = moment(s);
  if (planets) PlanetService.list = planets.map(Planet.deserialize);

  console.log('updated state :', {
    state: +state,
    vectorClock,
    planets: PlanetService.list.map(p => p.toJson()),
  });
});

// Get the one with most peers
const lastState = ({ data: { state: a } }, { data: { state: b } }) => a - b;
const receiveState = proms => applyState(proms.sort(lastState).pop());
const retreiveLastState = (sender = ME) => multicast('/state', { sender }, 'get')
  .then(receiveState)
  .catch(e => console.log('Error', e));

const discoverPeers = (sender = ME) => multicast('/peers', { sender })
  .then(receivePeers)
  .catch(e => console.log('Error', e));

setInterval(discoverPeers, PEER_DISCOVER_INTERVAL);

// First round of discovering peers
discoverPeers().then(retreiveLastState);

app.listen(PORT, () => console.log(`Server up @ ${PORT}`));
