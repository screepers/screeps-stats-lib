/// <reference path="./stats.d.ts"/>
/// <reference path="../typings/index.d.ts"/>
/// <reference path="../node_modules/screeps-typescript-declarations/dist/screeps.d.ts"/>

// This is a bad way to do it but i'm not sure how to get lodash to play nice without
// importing it into the script, which could cause issues when running on screeps.
declare var _: any;

class ScreepsStats {
    private username: string = null;

    constructor() {
        if (!Memory.___screeps_stats) {
            Memory.___screeps_stats = {};
        }
        this.username = _.get(
            _.find(Game.structures, (s: Structure) => true), "owner.username",
            _.get(_.find(Game.creeps, (c: Creep) => true), "owner.username")
        ) as string || null;
        this.clean();
    }
    public clean(): void {
        let recorded = _.keys(Memory.___screeps_stats);
        if (recorded.length > 20) {
            recorded.sort();
            let limit = recorded.length - 20;
            for (let idx = 0; idx < limit; idx++) {
                let tick = +(recorded[idx]);
                this.removeTick(tick);
            }
        }
    }

    public addStat(key: string, value: any): void {
        // Key is in the format "parent.child.grandchild.greatgrandchild.etc"
        let keySplit = key.split(".");

        if (keySplit.length === 1) {
            Memory.___screeps_stats[Game.time][keySplit[0]] = value;
            return;
        }

        let start = Memory.___screeps_stats[Game.time][keySplit[0]];

        let tmp = {};
        for (let idx = 0, n = keySplit.length; idx < n; idx++) {
            if (idx === (n - 1)) {
                tmp[keySplit[idx]] = value;
            } else {
                tmp[keySplit[idx]] = {};
                tmp = tmp[keySplit[idx]];
            }
        }

        _.merge(start = Memory.___screeps_stats[Game.time], tmp);
    }

    public runBuiltinStats() {
        this.clean();
        let stats: ITickStat = {
            cpu: {
                bucket: Game.cpu.bucket,
                limit: Game.cpu.limit,
                tickLimit: Game.cpu.tickLimit,
            },
            gcl: {
                level: Game.gcl.level,
                progress: Game.gcl.progress,
                progressTotal: Game.gcl.progressTotal,
            },
            minerals: undefined,
            rooms: {
                subgroups: true,
            },
            sources: undefined,
            spawns: undefined,
            storage: undefined,
            terminal: undefined,
            tick: Game.time,
            time: new Date().toISOString(),
        };

        _.forEach(Game.rooms, (room: Room) => {
            if (!stats[room.name]) {
                stats.rooms[room.name] = {
                    sources: undefined,
                    subgroups: undefined,
                };
            }

            if (_.isEmpty(room.controller)) { return; }
            let controller = room.controller;

            // Is hostile room? Continue
            if (!controller.my) {
                if (!!controller.owner) { // Owner is set but is not this user.
                    if (controller.owner.username !== this.username) {
                        return;
                    }
                }
            }

            // Controller
            _.merge(stats.rooms[room.name], {
                level: controller.level,
                progress: controller.progress,
                reservation: _.get(controller, "reservation.ticksToEnd"),
                ticksToDowngrade: controller.ticksToDowngrade,
                upgradeBlocked: controller.upgradeBlocked,
            });

            if (controller.level > 0) {
                // Room
                _.merge(stats.rooms[room.name], {
                    energyAvailable: room.energyAvailable,
                    energyCapacityAvailable: room.energyCapacityAvailable,
                });

                // Storage
                if (room.storage) {
                    _.defaults(stats, {
                        storage: {
                            subgroups: true,
                        },
                    });
                    stats.storage[room.storage.id] = {
                        resources: {},
                        room: room.name,
                        store: _.sum(room.storage.store),
                    };
                    for (let resourceType in room.storage.store) {
                        if (!resourceType) { continue; }
                        stats.storage[room.storage.id].resources[resourceType] = room.storage.store[resourceType];
                        stats.storage[room.storage.id][resourceType] = room.storage.store[resourceType];
                    }
                }

                // Terminals
                if (room.terminal) {
                    _.defaults(stats, {
                        terminal: {
                            subgroups: true,
                        },
                    });
                    stats.terminal[room.terminal.id] = {
                        resources: {},
                        room: room.name,
                        store: _.sum(room.terminal.store),
                    };
                    for (let resourceType in room.storage.store) {
                        if (!resourceType) { continue; }
                        stats.terminal[room.terminal.id].resources[resourceType] = room.terminal.store[resourceType];
                        stats.terminal[room.terminal.id][resourceType] = room.terminal.store[resourceType];
                    }
                }
            }

            this.roomExpensive(stats, room);
        });

        // Spawns
        _.defaults(stats, {
            spawns: {
                subgroups: true,
            },
        });
        _.forEach(Game.spawns, function(spawn: Spawn) {
            stats.spawns[spawn.name] = {
                busy: !!spawn.spawning,
                remainingTime: _.get(spawn, "spawning.remainingTime", 0),
                room: spawn.room.name,
            };
        });

        Memory.___screeps_stats[Game.time] = stats;
    }

    public roomExpensive(stats: ITickStat, room: Room) {
        // Source Mining
        _.defaults(stats, {
            minerals: {
                subgroups: true,
            },
            sources: {
                subgroups: true,
            },
        });

        stats.rooms[room.name].sources = {};
        let sources = room.find(FIND_SOURCES);

        _.forEach(sources, (source: Source) => {
            stats.sources[source.id] = {
                averageHarvest: 0,
                energy: source.energy,
                energyCapacity: source.energyCapacity,
                room: room.name,
                ticksToRegeneration: source.ticksToRegeneration,
            };
            if (source.energy < source.energyCapacity && source.ticksToRegeneration) {
                let energyHarvested = source.energyCapacity - source.energy;
                if (source.ticksToRegeneration < ENERGY_REGEN_TIME) {
                    let ticksHarvested = ENERGY_REGEN_TIME - source.ticksToRegeneration;
                    stats.sources[source.id].averageHarvest = energyHarvested / ticksHarvested;
                }
            }

            stats.rooms[room.name].energy += source.energy;
            stats.rooms[room.name].energyCapacity += source.energyCapacity;
        });

        // Mineral Mining
        let minerals = room.find(FIND_MINERALS);
        stats.rooms[room.name].minerals = {};
        _.forEach(minerals, (mineral: Mineral) => {
            stats.minerals[mineral.id] = {
                mineralAmount: mineral.mineralAmount,
                mineralType: mineral.mineralType,
                room: room.name,
                ticksToRegeneration: mineral.ticksToRegeneration,
            };
            stats.rooms[room.name].mineralAmount += mineral.mineralAmount;
            stats.rooms[room.name].mineralType += mineral.mineralType;
        });

        // Hostiles in Room
        let hostiles = room.find(FIND_HOSTILE_CREEPS);
        stats.rooms[room.name].hostiles = {};
        _.forEach(hostiles, (hostile: Creep) => {
            if (!stats.rooms[room.name].hostiles[hostile.owner.username]) {
                stats.rooms[room.name].hostiles[hostile.owner.username] = 1;
            } else {
                stats.rooms[room.name].hostiles[hostile.owner.username]++;
            }
        });

        // My Creeps
        stats.rooms[room.name].creeps = room.find(FIND_MY_CREEPS).length;
    }

    public removeTick(tick: number | number[]): string {
        if (typeof tick === "array") {
            for (let tickItem of tick) {
                this.removeTick(tickItem);
            }
            return `ScreepStats: Processed ${tick.length} ticks`;
        }

        let tickNumber: number = tick as number;
        if (!!Memory.___screeps_stats[tickNumber]) {
            delete Memory.___screeps_stats[tickNumber];
            return `ScreepStats: Removed tick ${tickNumber}`;
        } else {
            return `ScreepStats: tick ${tickNumber} was not present to remove`;
        }
    }

    public getStats(json: boolean): string | { [tick: number]: ITickStat } {
        if (json) {
            return JSON.stringify(Memory.___screeps_stats);
        } else {
            return Memory.___screeps_stats;
        }
    }

    public getStatsForTick(tick: number): ITickStat {
        let stats = Memory.___screeps_stats[tick];
        if (!stats) {
            return null;
        }

        return stats;
    }
}

export = ScreepsStats;
