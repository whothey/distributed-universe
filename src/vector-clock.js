const greater = (a, b) => (a > b ? a : b);

class VectorClock {
  constructor(me) {
    this.state = {};
    this.me = null;

    this.me = me;
    this.state[me] = 0;
  }

  replace(by) {
    this.state = Object.assign({}, by);
  }

  increment() { this.state[this.me] += 1; }

  updateClock(other) {
    const allClocks = Object.keys(Object.assign({}, this.state, other));

    this.state = allClocks
      .reduce((a, x) => Object.assign(a, { [x]: greater(this.state[x], other[x]) }), {});
  }

  serialize() {
    return Object.assign({}, this.state);
  }
}

module.exports = VectorClock;
