if (!Array.prototype.toReversed) {
  Array.prototype.toReversed = function () {
    return this.slice().reverse();
  };
}

const { getDefaultConfig } = require("expo/metro-config");

module.exports = getDefaultConfig(__dirname);
