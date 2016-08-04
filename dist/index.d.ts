/// <reference path="../stats.d.ts" />
/// <reference path="../typings/index.d.ts" />
/// <reference path="../node_modules/screeps-typescript-declarations/dist/screeps.d.ts" />
export default class ScreepsStats {
    private username;
    constructor();
    clean(): void;
    addStat(key: string, value: any): void;
    runBuiltinStats(): void;
    roomExpensive(stats: ITickStat, room: Room): void;
    removeTick(tick: number | number[]): string;
    getStats(json: boolean): string | {
        [tick: number]: ITickStat;
    };
    getStatsForTick(tick: number): ITickStat;
}
