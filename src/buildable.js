const moment = require('moment');

class Buildable {
    scaleStamina(level) { return level; }
    scaleTime(level) { return level; }

    getLevelStaminaCost(level) {
        return this.scaleStamina(level);
    }

    getLevelBuildDuration(level) {
        return this.scaleTime(level);
    }

    buildOn(target, level) { }

    requestBuild(level, lastBuildDue) {
        let lastDue = lastBuildDue || moment(),
            due     = lastDue.clone().add(this.scaleTime(level), 'minutes');

        return new BuildOrder(this.identifier, due, level);
    }
}

class BuildOrder {
    constructor(attr, due, targetLevel) {
        if (! (due instanceof moment)) throw new TypeError('due date in BuildOrder must be a `moment` object');

        this.attr = attr;
        this.due  = due;
        this.targetLevel = parseInt(targetLevel);
    }

    doneOn(date) {
        return this.due.diff(date) <= 0;
    }

    /**
      * If now - next due is > means that the job was finished
      */
    done() {
        let now = moment();
        return this.doneOn(now);
    }

    buildOn(target) {
        target.attributes[this.attr] += 1;
    }
}

module.exports = { Buildable, BuildOrder };
