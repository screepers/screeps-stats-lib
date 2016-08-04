"use strict";
var ScreepsStats = (function () {
    function ScreepsStats() {
        this.username = null;
        if (!Memory.___screeps_stats) {
            Memory.___screeps_stats = {};
        }
        this.username = _.get(_.find(Game.structures, function (s) { return true; }), "owner.username", _.get(_.find(Game.creeps, function (c) { return true; }), "owner.username")) || null;
        this.clean();
    }
    ScreepsStats.prototype.clean = function () {
        var recorded = _.keys(Memory.___screeps_stats);
        if (recorded.length > 20) {
            recorded.sort();
            var limit = recorded.length - 20;
            for (var idx = 0; idx < limit; idx++) {
                var tick = +(recorded[idx]);
                this.removeTick(tick);
            }
        }
    };
    ScreepsStats.prototype.addStat = function (key, value) {
        var keySplit = key.split(".");
        if (keySplit.length === 1) {
            Memory.___screeps_stats[Game.time][keySplit[0]] = value;
            return;
        }
        var start = Memory.___screeps_stats[Game.time][keySplit[0]];
        var tmp = {};
        for (var idx = 0, n = keySplit.length; idx < n; idx++) {
            if (idx === (n - 1)) {
                tmp[keySplit[idx]] = value;
            }
            else {
                tmp[keySplit[idx]] = {};
                tmp = tmp[keySplit[idx]];
            }
        }
        _.merge(start = Memory.___screeps_stats[Game.time], tmp);
    };
    ScreepsStats.prototype.runBuiltinStats = function () {
        var _this = this;
        this.clean();
        var stats = {
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
        _.forEach(Game.rooms, function (room) {
            if (!stats[room.name]) {
                stats.rooms[room.name] = {
                    sources: undefined,
                    subgroups: undefined,
                };
            }
            if (_.isEmpty(room.controller)) {
                return;
            }
            var controller = room.controller;
            if (!controller.my) {
                if (!!controller.owner) {
                    if (controller.owner.username !== _this.username) {
                        return;
                    }
                }
            }
            _.merge(stats.rooms[room.name], {
                level: controller.level,
                progress: controller.progress,
                reservation: _.get(controller, "reservation.ticksToEnd"),
                ticksToDowngrade: controller.ticksToDowngrade,
                upgradeBlocked: controller.upgradeBlocked,
            });
            if (controller.level > 0) {
                _.merge(stats.rooms[room.name], {
                    energyAvailable: room.energyAvailable,
                    energyCapacityAvailable: room.energyCapacityAvailable,
                });
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
                    for (var resourceType in room.storage.store) {
                        if (!resourceType) {
                            continue;
                        }
                        stats.storage[room.storage.id].resources[resourceType] = room.storage.store[resourceType];
                        stats.storage[room.storage.id][resourceType] = room.storage.store[resourceType];
                    }
                }
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
                    for (var resourceType in room.storage.store) {
                        if (!resourceType) {
                            continue;
                        }
                        stats.terminal[room.terminal.id].resources[resourceType] = room.terminal.store[resourceType];
                        stats.terminal[room.terminal.id][resourceType] = room.terminal.store[resourceType];
                    }
                }
            }
            _this.roomExpensive(stats, room);
        });
        _.defaults(stats, {
            spawns: {
                subgroups: true,
            },
        });
        _.forEach(Game.spawns, function (spawn) {
            stats.spawns[spawn.name] = {
                busy: !!spawn.spawning,
                remainingTime: _.get(spawn, "spawning.remainingTime", 0),
                room: spawn.room.name,
            };
        });
        Memory.___screeps_stats[Game.time] = stats;
    };
    ScreepsStats.prototype.roomExpensive = function (stats, room) {
        _.defaults(stats, {
            minerals: {
                subgroups: true,
            },
            sources: {
                subgroups: true,
            },
        });
        stats.rooms[room.name].sources = {};
        var sources = room.find(FIND_SOURCES);
        _.forEach(sources, function (source) {
            stats.sources[source.id] = {
                averageHarvest: 0,
                energy: source.energy,
                energyCapacity: source.energyCapacity,
                room: room.name,
                ticksToRegeneration: source.ticksToRegeneration,
            };
            if (source.energy < source.energyCapacity && source.ticksToRegeneration) {
                var energyHarvested = source.energyCapacity - source.energy;
                if (source.ticksToRegeneration < ENERGY_REGEN_TIME) {
                    var ticksHarvested = ENERGY_REGEN_TIME - source.ticksToRegeneration;
                    stats.sources[source.id].averageHarvest = energyHarvested / ticksHarvested;
                }
            }
            stats.rooms[room.name].energy += source.energy;
            stats.rooms[room.name].energyCapacity += source.energyCapacity;
        });
        var minerals = room.find(FIND_MINERALS);
        stats.rooms[room.name].minerals = {};
        _.forEach(minerals, function (mineral) {
            stats.minerals[mineral.id] = {
                mineralAmount: mineral.mineralAmount,
                mineralType: mineral.mineralType,
                room: room.name,
                ticksToRegeneration: mineral.ticksToRegeneration,
            };
            stats.rooms[room.name].mineralAmount += mineral.mineralAmount;
            stats.rooms[room.name].mineralType += mineral.mineralType;
        });
        var hostiles = room.find(FIND_HOSTILE_CREEPS);
        stats.rooms[room.name].hostiles = {};
        _.forEach(hostiles, function (hostile) {
            if (!stats.rooms[room.name].hostiles[hostile.owner.username]) {
                stats.rooms[room.name].hostiles[hostile.owner.username] = 1;
            }
            else {
                stats.rooms[room.name].hostiles[hostile.owner.username]++;
            }
        });
        stats.rooms[room.name].creeps = room.find(FIND_MY_CREEPS).length;
    };
    ScreepsStats.prototype.removeTick = function (tick) {
        if (typeof tick === "array") {
            for (var _i = 0, tick_1 = tick; _i < tick_1.length; _i++) {
                var tickItem = tick_1[_i];
                this.removeTick(tickItem);
            }
            return "ScreepStats: Processed " + tick.length + " ticks";
        }
        var tickNumber = tick;
        if (!!Memory.___screeps_stats[tickNumber]) {
            delete Memory.___screeps_stats[tickNumber];
            return "ScreepStats: Removed tick " + tickNumber;
        }
        else {
            return "ScreepStats: tick " + tickNumber + " was not present to remove";
        }
    };
    ScreepsStats.prototype.getStats = function (json) {
        if (json) {
            return JSON.stringify(Memory.___screeps_stats);
        }
        else {
            return Memory.___screeps_stats;
        }
    };
    ScreepsStats.prototype.getStatsForTick = function (tick) {
        var stats = Memory.___screeps_stats[tick];
        if (!stats) {
            return null;
        }
        return stats;
    };
    return ScreepsStats;
}());
module.exports = ScreepsStats;
