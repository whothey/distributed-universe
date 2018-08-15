const moment = require('moment');
const {
    AttackAttribute, DefenseAttribute, IntelAttribute
} = require('./attributes');

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
Planet.STAMINA_UPDATE_FREQ = 'minutes';

Planet.ATTRIBUTES = {
    'attack':  new AttackAttribute(),
    'defense': new DefenseAttribute(),
    'intel':   new IntelAttribute()
};

module.exports = Planet;
