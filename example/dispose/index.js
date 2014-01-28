module.exports.main = function () {
  var graph = require('ngraph.generators').grid(10, 10);
  var threeGraphics = require('../../')(graph, {interactive: false});
  var layout = threeGraphics.layout;

  for (var i = 0; i < 100; ++i) {
    layout.step();
  }

  // let flickering begin!
  setInterval(function () {
    threeGraphics.dispose({layout: false});
    threeGraphics = require('../../')(graph, { layout: layout});
    threeGraphics.renderOneFrame();
  }, 1000);
}
