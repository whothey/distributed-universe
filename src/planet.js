const moment = require('moment');
const FastList = require('fast-list');
const {
    AttackAttribute, DefenseAttribute, IntelAttribute
} = require('./attributes');

class Planet {
    constructor(name) {
        this.name          = name;
        this.staminaFilled = moment(); // When it's filled
        this.maxStamina    = 100;
        this.maxHealth     = 1000;
        this.health        = 1000;
        this.q             = new FastList();
        this.attributes    = {};
        this._lastBuilds   = {};

        for (let key in Planet.ATTRIBUTES)
            this.attributes[key] = 1;
    }

    get staminaRate() {
        return Planet.STAMINA_RATE;
    }

    get stamina() {
        let now = moment();

        return this.getStaminaOn(now);
    }

    getStaminaOn(date) {
        let diff = date.diff(this.staminaFilled, 'minutes'),
            rate = Math.ceil(Math.abs(diff) * this.staminaRate);

        return this.maxStamina - rate;
    }

    setMaxStamina(value) {
        let rate = (value - this.maxStamina) * this.staminaRate;

        this.staminaFilled.add(rate, 'minutes');
        this.maxStamina = value;
    }

    processq(now) {
        let job = this.q._head ? this.q._head.data : null, last;

        if (job.doneOn(now)) {
            console.log("Job done:", job);
            job  = this.q.shift();
            last = this._lastBuilds[job.attr];

            // If current job is the last one, set the last to null
            if (job == last) this._lastBuilds[job.attr] = null;

            // Apply updates
            job.buildOn(this);
        }
    }

    build(param) {
        let attr = Planet.ATTRIBUTES[param], level, lastBuild, buildOrder, staminaRecover;
        if (attr === undefined) throw new TypeError("Invalid build parameter!");

        if (this._lastBuilds[param])
            level = this._lastBuilds[param].targetLevel + 1;
        else
            level = this.attributes[param] + 1;

        if (this.q._tail) lastBuild = this.q._tail.data.due;
        else lastBuild = null;

        buildOrder     = attr.requestBuild(level, lastBuild);
        staminaRecover = attr.getLevelStaminaCost(level) * this.staminaRate;

        this._lastBuilds[param] = buildOrder;

        this.staminaFilled.add(staminaRecover, 'minutes');
        this.q.push(buildOrder);
    }

    applyBuild(buildJob) {
        buildJob.buildOn(this);
    }

    toJson() {
        return {
            name:       this.name,
            attributes: this.attributes,
            health:     this.health,
            maxHealth:  this.maxHealth,
            stamina:    this.stamina,
            maxStamina: this.maxStamina,
        };
    }

    qToJson() {
        let list = new Array(this.q.length);

        for (let i = 0, item = this.q.item(i);
             i < this.q.length, item = this.q.item(i);
             i++) {
            list[i] = {
                attr: item.attr,
                due: +item.due, // Convert moment to UNIX timestamp
                level: item.targetLevel
            };
        }

        return list;
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
