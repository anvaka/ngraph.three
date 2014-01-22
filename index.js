module.exports = function (graph, settings) {
  var merge = require('ngraph.merge');
  settings = merge(settings, {
    interactive: true
  });

  var layout = createLayout(settings);
  var renderer = createRenderer(settings);
  var camera = createCamera(settings);
  var scene = settings.scene || new THREE.Scene();
  var controls = createControls();

  var defaults = require('./lib/defaults');

  // Default callbacks to build/render nodes and links
  var nodeUIBuilder, nodeRenderer, linkUIBuilder, linkRenderer;

  var nodeUI, linkUI; // Storage for UI of nodes/links

  var graphics = {
    run: run,
    renderOneFrame: renderOneFrame,

    /**
     * Gets UI object for a given node id
     */
    getNodeUI : function (nodeId) {
      return nodeUI[nodeId];
    },

    getLinkUI: function (linkId) {
      return linkUI[linkId];
    },

    /**
     * This callback creates new UI for a graph node. This becomes helpful
     * when you want to precalculate some properties, which otherwise could be
     * expensive during rendering frame.
     *
     * @callback createNodeUICallback
     * @param {object} node - graph node for which UI is required.
     * @returns {object} arbitrary object which will be later passed to renderNode
     */
    /**
     * This function allows clients to pass custon node UI creation callback
     *
     * @param {createNodeUICallback} createNodeUICallback - The callback that
     * creates new node UI
     * @returns {object} this for chaining.
     */
    createNodeUI : function (createNodeUICallback) {
      nodeUI = {};
      nodeUIBuilder = createNodeUICallback;
      rebuildUI();
      return this;
    },

    /**
     * This callback is called by graphics when it wants to render node on
     * a screen.
     *
     * @callback renderNodeCallback
     * @param {object} node - result of createNodeUICallback(). It contains anything
     * you'd need to render a node
     */
    /**
     * Allows clients to pass custom node rendering callback
     *
     * @param {renderNodeCallback} renderNodeCallback - Callback which renders
     * node.
     *
     * @returns {object} this for chaining.
     */
    renderNode: function (renderNodeCallback) {
      nodeRenderer = renderNodeCallback;
      return this;
    },

    /**
     * This callback creates new UI for a graph link. This becomes helpful
     * when you want to precalculate some properties, which otherwise could be
     * expensive during rendering frame.
     *
     * @callback createLinkUICallback
     * @param {object} link - graph link for which UI is required.
     * @returns {object} arbitrary object which will be later passed to renderNode
     */
    /**
     * This function allows clients to pass custon node UI creation callback
     *
     * @param {createLinkUICallback} createLinkUICallback - The callback that
     * creates new link UI
     * @returns {object} this for chaining.
     */
    createLinkUI : function (createLinkUICallback) {
      linkUI = {};
      linkUIBuilder = createLinkUICallback;
      rebuildUI();
      return this;
    },

    /**
     * This callback is called by graphics when it wants to render link on
     * a screen.
     *
     * @callback renderLinkCallback
     * @param {object} link - result of createLinkUICallback(). It contains anything
     * you'd need to render a link
     */
    /**
     * Allows clients to pass custom link rendering callback
     *
     * @param {renderLinkCallback} renderLinkCallback - Callback which renders
     * link.
     *
     * @returns {object} this for chaining.
     */
    renderLink: function (renderLinkCallback) {
      linkRenderer = renderLinkCallback;
      return this;
    },

    // expose properties
    renderer: renderer,
    camera: camera,
    scene: scene,
    layout: layout
  };

  initialize();

  return graphics;

  function initialize() {
    nodeUIBuilder = defaults.createNodeUI,
    nodeRenderer  = defaults.nodeRenderer,
    linkUIBuilder = defaults.createLinkUI,
    linkRenderer  = defaults.linkRenderer;
    nodeUI = {}, linkUI = {}; // Storage for UI of nodes/links

    graph.forEachLink(initLink);
    graph.forEachNode(initNode);

    graph.on('changed', onGraphChanged);
  }

  function run() {
    requestAnimationFrame(run);
    layout.step();
    controls.update(1);
    renderOneFrame();
  }

  function renderOneFrame() {
    Object.keys(linkUI).forEach(renderLink);
    Object.keys(nodeUI).forEach(renderNode);
    renderer.render(scene, camera);
  }

  function renderNode(nodeId) {
    nodeRenderer(nodeUI[nodeId]);
  }

  function renderLink(linkId) {
    linkRenderer(linkUI[linkId]);
  }

  function initNode(node) {
    var ui = nodeUIBuilder(node);
    if (!ui) return;
    // augment it with position data:
    ui.pos = layout.getNodePosition(node.id);
    // and store for subsequent use:
    nodeUI[node.id] = ui;

    scene.add(ui);
  }

  function initLink(link) {
    var ui = linkUIBuilder(link);
    if (!ui) return;

    ui.from = layout.getNodePosition(link.fromId);
    ui.to = layout.getNodePosition(link.toId);

    linkUI[link.id] = ui;
    scene.add(ui);
  }

  function onGraphChanged(changes) {
    for (var i = 0; i < changes.length; ++i) {
      var change = changes[i];
      if (change.changeType === 'add') {
        if (change.node) {
          initNode(change.node);
        }
        if (change.link) {
          initLink(change.link);
        }
      } else if (change.changeType === 'remove') {
        if (change.node) {
          var node = nodeUI[change.node.id];
          if (node) { scene.remove(node); }
          delete nodeUI[change.node.id];
        }
        if (change.link) {
          var link = linkUI[change.link.id];
          if (link) { scene.remove(link); }
          delete linkUI[change.link.id];
        }
      }
    }
  }

  function createLayout(settings) {
    if (settings.layout) {
      return settings.layout; // user has its own layout algorithm. Use it;
    }

    // otherwise let's create a default force directed layout:
    return require('ngraph.forcelayout3d')(graph, settings.physicsSettings);
  }

  function createRenderer(settings) {
    if (settings.renderer) {
      return settings.renderer;
    }

    var isWebGlSupported = ( function () { try { var canvas = document.createElement( 'canvas' ); return !! window.WebGLRenderingContext && ( canvas.getContext( 'webgl' ) || canvas.getContext( 'experimental-webgl' ) ); } catch( e ) { return false; } } )();
    var renderer = isWebGlSupported ? new THREE.WebGLRenderer(settings) : new THREE.CanvasRenderer(settings);
    var container = settings.container || window;
    renderer.setSize(container.innerWidth, container.innerHeight);

    if (settings.container) {
      settings.container.appendChild(renderer.domElement);
    } else {
      document.body.appendChild(renderer.domElement);
    }

    return renderer;
  }

  function createCamera(settings) {
    if (settings.camera) {
      return settings.camera;
    }
    var container = renderer.domElement;
    var camera = new THREE.PerspectiveCamera(75, container.clientWidth/container.clientHeight, 0.1, 3000);
    camera.position.z = 400;
    return camera;
  }

  function createControls() {
    if (settings.interactive) {
      var FlyControls = require('./lib/flyControls')
      var controls = new FlyControls(camera);
      return controls;
    }
    return {
      update: function () {} // noop
    };
  }

  function rebuildUI() {
    Object.keys(nodeUI).forEach(function (nodeId) {
      scene.remove(nodeUI[nodeId]);
    });

    Object.keys(linkUI).forEach(function (linkId) {
      scene.remove(linkUI[nodeId]);
    });

    graph.forEachLink(initLink);
    graph.forEachNode(initNode);
  }
}
