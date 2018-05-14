TarumaeRenderer = {};

require("../src/js/ver.js");

var version = TarumaeRenderer.Version;

if (process.argv.includes('--major')) {
  console.log( version.major );
}
else if (process.argv.includes('--minor')) {
  console.log( [version.major, version.minor].join(".") );
}
else {
  console.log( [version.major, version.minor, version.build + version.revision].join(".") );
}

