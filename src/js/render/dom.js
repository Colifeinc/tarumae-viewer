////////////////////////////////////////////////////////////////////////////////
// tarumae engine
// https://tarumae.tech
//
// Copyright(c) 2016-2019 BULB Corp., Jingwood, all rights reserved
////////////////////////////////////////////////////////////////////////////////

const containerStyle = [
	"#canvas-container { position: relative; }",
	"#canvas-container { width: 100%; }",
	"#canvas-container:before { content: ''; }",
	"#canvas-container:before { display: block; }",
	"#canvas-container canvas, #canvas-container .surface { position: absolute; }",
	"#canvas-container canvas, #canvas-container .surface { top: 0; }",
	"#canvas-container canvas, #canvas-container .surface { left: 0; }",
	"#canvas-container canvas, #canvas-container .surface { width: 100%; }",
	"#canvas-container canvas, #canvas-container .surface { height: 100%; }",
	"#canvas-container .surface div { pointer-events: none; }",
];

function initDOM(renderer) {

  const containerId = renderer.options.containerId;
  const container = document.getElementById(containerId);

  if (!container) {
    throw new Error("cannot find canvas container");
    return;
  }

  renderer.container = container;

  // 3d canvas
  var canvas3d = document.createElement("canvas");
  renderer.canvas = canvas3d;
  container.appendChild(renderer.canvas);

  // 2d canvas
  renderer.canvas2d = document.createElement("canvas");
  container.appendChild(renderer.canvas2d);
  
  // surface
  renderer.surface = document.createElement("div");
  renderer.surface.className = "surface";
  renderer.surface.focus();
  container.appendChild(renderer.surface);

  // canvas container

  const tagId = "tarumae-stylesheet";

  if (document.getElementById(tagId) !== null) {
    document.getElementById(tagId).remove();
  }

  const styleSheet = document.createElement("style");
  styleSheet.type = "text/css";
  styleSheet.media = "screen";
  styleSheet.id = tagId;
  document.getElementsByTagName("head").item(0).appendChild(styleSheet);
  
  const css = styleSheet.sheet;

  for (const value of containerStyle) {
    let rule = value;
    
    if (containerId !== "canvas-container") {
      rule = value.replace(/#canvas-container/g, "#" + containerId);
    }

    css.insertRule(rule, 0);
  }
}

export { initDOM };