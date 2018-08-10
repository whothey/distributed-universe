const moment = require('moment');

class Cost {
    constructor(name, stamina, time) {
        this.name    = name;
        this.stamina = stamina;
        this.time    = time;
    }
}

class BuildOrder {
    constructor(name, due) {
        this.name = name;
        this.due  = due;
    }
}

class Planet {
    constructor(name) {
        this.name    = name;
        this.health  = 1000;
        this.defense = 1;
        this.attack  = 1;
        this.intel   = 1;
        this.staminaFilled = moment(); // When it's filled
        this.maxStamina = 100;
        this.q       = [];
    }

    get stamina() {
        let now  = moment(),
            diff = now.diff(this.staminaFilled, 'minutes'),
            rate = Math.abs(diff * Planet.STAMINA_RATE);

        return this.maxStamina - rate;
    }

    build(param, lvl) {
        let cost = Planet.BASE_COSTS[param];
        if (cost === undefined) throw "Invalid build parameter!";

        let buildOrder = new BuildOrder(
            `Build ${param}`,
            moment().add(cost.time, 'minutes')
        );

        this.stamina.subtract(cost.stamina * Planet.STAMINA_RATE, 'minutes');
        this.q.push(buildOrder);
    }

    toJson() {
        return {
            name:    this.name,
            health:  this.health,
            defense: this.defense,
            attack:  this.attack,
            intel:   this.intel,
            stamina: this.stamina
        };
    }
}

// In minutes, time to add 1
Planet.STAMINA_RATE = 1;

Planet.BASE_COSTS = {
    ATTACK:  new Cost(15, 30),
    DEFENSE: new Cost(30, 15),
    INTEL:   new Cost(15, 20)
};

module.exports = Planet;
