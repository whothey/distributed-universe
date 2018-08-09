const express = require('express');
const bodyParser = require('body-parser');

const PORT    = process.env.PORT || 3000;

let app = express();

app.use(bodyParser.json());

let PlanetService = {
    list: [ ],

    create: function(name) {
        return {
            name: name,
            defense: 1,
            attack: 1,
            intel: 1,
            stamina: 100,
            q: []
        }
    }
};

app.get('/', (req, res) => {
    res.json({ message: "Hi there!" });
});

app.get('/planets', (req, res) => {
    res.json({ planets: PlanetService.list });
});

app.get('/planets/:planetid', (req, res) => {
    res.json({ planet: PlanetService.list[req.params.planetid] });
});

app.post('/planets', (req, res) => {
    let name = req.params.name;

    PlanetService.list.push(PlanetService.create(name))

    res.json({ message: "OK!", planet_id: newid });
});

app.listen(PORT, () => console.log(`Server up @ ${PORT}`));
