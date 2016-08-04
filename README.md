# Screeps Stats Library

This is a Javascript library created to enhance the [Screeps](http://www.screeps.com) stats acquired with
the [screeps-stats](https://github.com/screepers/screeps-stats) project.

By default `screeps-stats` will ingest the console and performance data (cpu and memory size).

With the addition of this client side (in game, TypeScript or Javascript) module additional statistics, including
custom stats, can be added.

When the stats collection service picks stats up from the server it will erase them, so as long as the service
is running only a few ticks worth of data will be stored. If the stats service fails, stats will be collected
for up to 20 ticks, at which point the oldest data will be removed.



## Installation

The easiest way to use this software is via npm:
```
npm install --save screeps-stats
```

## Usage

A note about the examples below: It's important for the `ScreepsStats` class to get assigned to `global.State`, as the stats collection
server will use this class to delete ticks that it has finished processing.

TypeScript example:
```typescript
import ScreepsStats from "screeps-stats";
global.Stats = new ScreepsStats();

module.exports.loop = function() {
    
    // Do code stuff!

    // Run Stats Last.
    Stats.runBuiltinStats();
}
```

Javascript example:
```javascript
var ScreepsStats = require('screeps-stats')
global.Stats = new ScreepsStats()

module.exports.loop = function () {

  // Do code stuff!

  // Run Stats Last.
  Stats.runBuiltinStats()
}
```
