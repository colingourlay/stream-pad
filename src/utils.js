const { Buttons } = require('launchpad-mini');

module.exports.getButtonsSet = (key) => {
  if (key[0] === 8) {
    return Buttons.Scene;
  } else if (key[1] === 8) {
    return Buttons.Automap;
  }

  return Buttons.Grid;
};
