// Extending some existing definitions
interface Memory {
    ___screeps_stats: { [tick: number]: ITickStat };
}
interface StructureController {
    upgradeBlocked: boolean;
}

// Custom memory stuff for stats 
interface ITickStat {
    cpu: ITickCpuStat;
    gcl: ITickGclStat;
    minerals: { [id: string]: ITickMineralStat | any };
    rooms: { [roomName: string]: ITickRoomStat | any };
    spawns: { [roomName: string]: ITickSpawnStat | boolean };
    sources: { [id: string]: ITickSourceStat };
    storage: { [id: string]: ITickStorageStat | any };
    terminal: { [id: string]: ITickStorageStat | any };
    tick: number;
    time: string;
}

interface ITickCpuStat {
    bucket: number;
    limit: number;
    tickLimit: number;
}

interface ITickGclStat {
    level: number;
    progress: number;
    progressTotal: number;
}

interface ITickRoomStat {
    sources: any;
    subgroups: boolean;
}

interface ITickSourceStat {
    averageHarvest: number;
    room: string;
    energy: number;
    energyCapacity: number;
    ticksToRegeneration: number;
}

interface ITickMineralStat {
    room: string;
    mineralType: string;
    mineralAmount: number;
    ticksToRegeneration: number;
}

interface ITickStorageStat {
    resources: { [resourceType: string]: number };
    room: string;
    store: number;
}

interface ITickSpawnStat {
    busy: boolean;
    remainingTime: number;
    room: string;
}
