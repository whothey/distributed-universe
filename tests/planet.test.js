const assert = require('assert');
const Planet = require('../src/planet');
const moment = require('moment');

describe('Planet', function() {
    describe('constructor', function() {
        it('should create a planet', function() {
            let p = new Planet('name');

            assert.ok(p instanceof Planet, "Can't create a planet!");
        });

        it('should be constructed and have custom name', function() {
            // Bounds for random names
            const MINLEN = 3, MAXLEN = 18, MINASCII = 33, MAXASCII = 123,
                  randomRange = (min, max) => Math.floor(Math.random() * (max - min)) + min;

            // Define a length for name, and generate a random string
            let namelen = randomRange(MINLEN, MAXLEN),
                range   = Array(namelen),
                name    = range.map(() => String.fromCharCode(randomRange(MINASCII, MAXASCII)));

            let p = new Planet(name);

            assert.ok(p.name == name);
        });
    });

    describe("#setMaxStamina", function() {
        it('has stamina time updated when seted', function() {
            const GROW = 60;

            let p       = new Planet('setmx'),
                oldfill = p.staminaFilled.clone(),
                newval  = p.stamina + GROW * p.staminaRate,
                diff;

            p.setMaxStamina(newval);

            diff = p.staminaFilled.diff(oldfill, Planet.STAMINA_UPDATE_FREQ);

            assert.ok(p.maxStamina == newval);
            assert.ok(diff == GROW);
        });
    });

    describe('#stamina', function() {
        it('should be an integer', function() {
            let p = new Planet('rand');

            assert(typeof p.stamina == 'number');
            assert(Math.round(p.stamina) == p.stamina);
        });

        it('could not be set', function() {
            let p = new Planet('other'),
                oldStamina = p.stamina;

            p.stamina = 200;

            assert.ok(oldStamina == p.stamina);
        });

        it('should grow in expected rate', function() {
            const RATE = Math.floor(Math.random() * (95 - 5) + 5);

            let p = new Planet('stamin'),
                earlier = moment().add(RATE, Planet.STAMINA_UPDATE_FREQ);

            assert.ok(p.getStaminaOn(earlier) < p.stamina);
            assert.ok(p.getStaminaOn(earlier) + RATE == p.stamina);
        });
    });

    describe('#build', function() {
        it('can\'t upgrade a param that doesn\'t exists', function() {
            let p = new Planet('planet');

            try {
                p.build('abacate');
                assert(false);
            } catch (e) {
                assert.ok(e instanceof TypeError);
            }
        });

        it('places build order on queue', function() {
            const ATTR = 'attack';
            let p = new Planet('p');

            assert.ok(p.q.length == 0);
            p.build(ATTR);
            assert.ok(p.q.length == 1);
        });

        it('loses stamina when a build is placed', function() {
            const ATTR = 'attack';
            let p = new Planet('p'), before = p.stamina,
                evocost = Planet.ATTRIBUTES[ATTR].getLevelStaminaCost(2);

            p.build(ATTR);

            assert.ok(p.stamina < before);
            assert.ok(p.stamina == before - evocost);
        });

        it('processes the build queue', function() {
            const ATTR = 'attack';
            let p = new Planet('p'),
                duration = Planet.ATTRIBUTES[ATTR].getLevelBuildDuration(2);

            p.build(ATTR);
            p.processq(moment().add(duration, 'minutes'));

            assert.ok(p.q.length == 0);
            assert.ok(p.attributes[ATTR] == 2);
        });

        it('sets the build order due time and level considering builds on queue', function() {
            const ATTRS = ['attack', 'defense', 'defense'];

            let p = new Planet('pqq'),
                now = moment(),
                durations = [
                    Planet.ATTRIBUTES[ATTRS[0]].getLevelBuildDuration(2),
                    Planet.ATTRIBUTES[ATTRS[1]].getLevelBuildDuration(2),
                    Planet.ATTRIBUTES[ATTRS[2]].getLevelBuildDuration(3),
                ];

            ATTRS.reduce((acc, attr, i) => {
                p.build(attr);

                // accduemin is the accumulator for minutes that should be the
                // right and currentDiff is the diff from now to build time,
                // which must follow the accduemin
                let accduemin   = acc + durations[i],
                    dueDate     = p.q.item(i).due,
                    currentDiff = Math.abs(now.diff(dueDate, Planet.STAMINA_UPDATE_FREQ));

                assert.ok(currentDiff == accduemin);

                return accduemin;
            }, 0);

            // And then the queue is properly processed
            durations.map((duration, i) => {
                let attr = ATTRS[i], currentLevel = p.attributes[attr];

                p.processq(moment().add(duration, 'minutes'));

                console.log(i, p.q.length, ATTRS.length - i - 1);
                assert.ok(p.q.length == ATTRS.length - i - 1);
                assert.ok(currentLevel + 1 == p.attributes[attr]);
            });
        });

        it('properly sets attr and level on build order', function() {
            const ATTR = 'defense';
            let p = new Planet('pq'), order;

            p.build(ATTR);

            order = p.q.item(0);

            assert.ok(order.attr == ATTR);
            assert.ok(order.due instanceof moment);
            assert.ok(order.targetLevel == 2);
        });
    });
});
