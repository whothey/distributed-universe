const express    = require('express');
const bodyParser = require('body-parser');
const Planet     = require('./src/planet');
const cors       = require('cors');
const moment     = require('moment');

const PORT = process.env.PORT || 3000;

let app = express();
let state = moment();

app.use(bodyParser.json());
app.use(cors());

let PlanetService = {
    // Force first planet to be 1
    list: [new Planet()]
};

app.get('/', (req, res) => {
    res.json({ message: "Hi there!" });
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

app.listen(PORT, () => console.log(`Server up @ ${PORT}`));
