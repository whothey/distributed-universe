const express    = require('express');
const bodyParser = require('body-parser');
const Planet     = require('./src/planet');
const cors       = require('cors');
const moment     = require('moment');
const axios      = require('axios');

const PORT = process.env.PORT || 3000;

let peers = new Set(process.argv.slice(2));
let state = moment();
let app   = express();

app.use(bodyParser.json());
app.use(cors());

let PlanetService = {
    // Force first planet to be 1
    list: [new Planet('Base')]
};

app.get('/', (req, res) => {
    res.json({ message: "Hi there!" });
});

app.get('/peers', (req, res) => {
    res.json({ peers: [...peers.values()] });
})

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

// Rollout peer update
setInterval(function() {
    console.log("STARTED PEERSYNC", peers);

    peers.forEach(peer => {
        axios.get(`http://${peer}/peers`)
            .then(r => {
                for (let peer of r.data.peers) peers.add(peer);
            })
            .catch(r => console.log(`ERROR ON PEER SYNC WITH ${peer}`, r));
    });
}, 10000);

setInterval(function() {
    peers.forEach(peer => {
        console.log("Syncing with " + peer);

        axios.get(`http://${peer}/sync/planets`)
            .then(r => {
                let current = PlanetService.list;

                PlanetService.list = r.data.planets.map(p => Planet.deserialize(p));
            })
            .catch(r => console.log(`ERROR ON PLANETS SYNC WITH ${peer}`, r));
        });
}, 2000);

app.listen(PORT, () => console.log(`Server up @ ${PORT}`));
