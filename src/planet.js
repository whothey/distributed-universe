const moment = require('moment');
const FastList = require('fast-list');
const {
    AttackAttribute, DefenseAttribute, IntelAttribute
} = require('./attributes');

class Planet {
    constructor(name, now = moment()) {
        this.name          = name;
        this.staminaFilled = now.clone(); // When it's filled
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
            rate = Math.ceil(diff * this.staminaRate);

        if (rate < 0)
            return this.maxStamina + rate;
        else
            return this.maxStamina;
    }

    setMaxStamina(value) {
        let rate = (value - this.maxStamina) * this.staminaRate;

        this.staminaFilled.add(rate, 'minutes');
        this.maxStamina = value;
    }

    processq(now) {
        let job = this.q._head ? this.q._head.data : null, last;

        while (job && job.doneOn(now)) {
            console.log("Job done:", job);
            job  = this.q.shift();
            last = this._lastBuilds[job.attr];

            // If current job is the last one, set the last to null
            if (job == last) this._lastBuilds[job.attr] = null;

            // Apply updates
            job.buildOn(this);
            Planet.ATTRIBUTES[job.attr].buildOn(this, job.targetLevel);
            job = this.q._head ? this.q._head.data : null, last;
        }
    }

    build(param, now = moment()) {
        let attr = Planet.ATTRIBUTES[param], level, lastBuild, buildOrder, staminaRecover, staminaCost;
        if (attr === undefined) throw new TypeError("Invalid build parameter: " + param);

        if (this._lastBuilds[param])
            level = this._lastBuilds[param].targetLevel + 1;
        else
            level = this.attributes[param] + 1;

        if (this.q._tail) lastBuild = this.q._tail.data.due;
        else lastBuild = now.clone();

        staminaCost = attr.getLevelStaminaCost(level);

        if (this.getStaminaOn(now) < staminaCost)
            throw `Not enought stamina ${this.getStaminaOn(now)} < ${staminaCost}`;

        buildOrder     = attr.requestBuild(level, lastBuild);
        staminaRecover = attr.getLevelStaminaCost(level) * this.staminaRate;

        this._lastBuilds[param] = buildOrder;

        console.log('rec', now, this.staminaFilled, now > this.staminaFilled);
        if (now > this.staminaFilled) this.staminaFilled = now.clone();

        this.staminaFilled.add(staminaRecover, 'minutes');

        this.q.push(buildOrder);
    }

    applyBuild(buildJob) {
        buildJob.buildOn(this);
    }

    toJson(time = moment()) {
        return {
            name:       this.name,
            attributes: this.attributes,
            health:     this.health,
            maxHealth:  this.maxHealth,
            stamina:    this.getStaminaOn(time),
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
