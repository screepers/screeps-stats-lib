/// <reference path="../typings/index.d.ts"/>
/// <reference path="../node_modules/screeps-typescript-declarations/dist/screeps.d.ts"/>

// Extending some existing definitions
interface Memory {
    ___screeps_stats: { [tick: number]: any };
}
interface StructureController {
    upgradeBlocked: boolean;
}

