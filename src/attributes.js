const { Buildable } = require('./buildable');

class AttackAttribute extends Buildable {
    constructor(args) {
        super(args);

        this.identifier = "attack";
    }
}

class DefenseAttribute extends Buildable {
    constructor(args) {
        super(args);

        this.identifier = "defense";
        this.baseHealth = 1000;
        this.growRate   = 14;
    }

    buildOn(target, level) {
        super.buildOn(target, level);

        target.maxHealth = Math.ceil(this.baseHealth + this.growRate * Math.log(level));
    }
}

class IntelAttribute extends Buildable {
    constructor(args) {
        super(args);

        this.identifier = "intel";
    }
}

module.exports = { AttackAttribute, DefenseAttribute, IntelAttribute };
