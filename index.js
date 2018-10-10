const express    = require('express');
const bodyParser = require('body-parser');
const Planet     = require('./src/planet');
const cors       = require('cors');
const moment     = require('moment');
const axios      = require('axios');
const chalk      = require('chalk');
const pkg        = require('./package.json');
const { reliable_multicast, reliable_receive } = require('./src/reliable');

const PORT = process.env.PORT || 3000;
const ME   = `localhost:${PORT}`;

const PEER_DISCOVER_INTERVAL = 10 * 1000; // 10 secs

let peers = new Set(process.argv.slice(2));
let state = moment();
let app   = express();

const multicast = reliable_multicast(peers);
const receive = reliable_receive;

console.log('Initial peers:', peers);


const reliable_receive = cb => ({ data } = {}) => cb(data);

app.use(bodyParser.json());
app.use(cors());

let PlanetService = {
    // Force first planet to be 1
    list: [new Planet('Base')]
};

const recs = new Set();

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

app.post('/sync/planets', reliable_receive);
app.get('/sync/planets', (req, res) => {
    console.log(`Syncing with ${req.hostname} [${req.ip}]`);

    res.json({
        planets: PlanetService.list.map(p => p.dumpJson())
    });
});

app.get('/planets', (req, res) => {
    res.json({ planets: PlanetService.list.map(p => p.toJson()) });
});

app.post('/planets', (req, res) => {
    let name = req.body.name,
        newid = PlanetService.list.length,
        planet = new Planet(name, state);

    console.log(`Created planet ${newid}: ${planet.name}`);
    PlanetService.list.push(planet);

    res.json({ message: "OK!", planet_id: newid });
});

app.post('/timewarp', (req, res) => {
    let time = req.body.time;

    console.log(`Time Warping: ${time} ${Planet.STAMINA_UPDATE_FREQ}`);
    state.add(time, Planet.STAMINA_UPDATE_FREQ);

    PlanetService.list.map(p => p.processq(state));

    res.json({ message: "OK!", newtime: +state });
});

app.get('/planets/:planetid', (req, res) => {
    let planet = PlanetService.list[req.params.planetid].toJson(state);

    res.json({ planet });
});

app.get('/planets/:planetid/q', (req, res) => {
    let q = PlanetService.list[req.params.planetid].qToJson();

    res.json({ q });
});

app.get('/planets/:planetid/build/:build', (req, res) => {
    let planetId   = req.params.planetid,
        buildParam = req.params.build,
        planet     = PlanetService.list[req.params.planetid];

    try {
        planet.build(buildParam, state);
        res.json({ 'status': 'building', 'building': buildParam });
    } catch (e) {
        res.json({
            'status': 'error',
            'error': e
        });
    }
});

const discover_peers = (sender = ME) => multicast('/peers', { sender })
      .then(receive_peers)
      .catch(e => console.log('Error', e));

// For each peer received, add to peers map.
const join_peers = ps => ps.forEach(p => p !== ME ? peers.add(p) : false);

// Destructure response body to peers and apply to join_peers
const receive_peers = proms => proms.map(
    receive(({ peers = [] } = {}) => join_peers(peers))
)

setInterval(discover_peers, PEER_DISCOVER_INTERVAL);

// First round of discovering peers
discover_peers();

app.listen(PORT, () => console.log(`Server up @ ${PORT}`));
