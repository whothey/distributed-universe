const express    = require('express');
const bodyParser = require('body-parser');
const Planet     = require('./src/planet');
const cors       = require('cors');

const PORT = process.env.PORT || 3000;

let app = express();

app.use(bodyParser.json());
app.use(cors());

let PlanetService = {
    list: []
};

app.get('/', (req, res) => {
    res.json({ message: "Hi there!" });
});

app.get('/planets', (req, res) => {
    res.json({ planets: PlanetService.list.map(p => p.toJson()) });
});

app.post('/planets', (req, res) => {
    let name = req.params.name,
        newid = PlanetService.list.length,
        planet = new Planet(name);

    console.log(`Created planet ${newid}:`, planet);
    PlanetService.list.push(planet);

    res.json({ message: "OK!", planet_id: newid });
});

app.get('/planets/:planetid', (req, res) => {
    res.json({ planet: PlanetService.list[req.params.planetid] });
});

app.get('/planets/:planetid/build/:build', (req, res) => {
    let planetId   = req.params.planetid,
        buildParam = req.params.build.toUpperCase(),
        level      = req.query.level || 1,
        planet     = PlanetService.list[req.params.planetid];

    try {
        planet.build(buildParam, level);
        res.json({ 'status': 'building', 'building': buildParam });
    } catch (e) {
        res.json({
            'status': 'error',
            'error': e
        });
    }
});

app.listen(PORT, () => console.log(`Server up @ ${PORT}`));
