import { resolve } from "node:path";
import type { ResonanceRoom } from "../realtime/resonanceRooms";
import { JsonFileStore } from "./fileStore";

type RoomStore = Record<string, ResonanceRoom>;

const store = new JsonFileStore<RoomStore>(resolve(process.cwd(), "backend/data/resonanceRooms.json"), {});

export const resonanceRoomRepository = {
  findByRoomId(roomId: string): ResonanceRoom | undefined {
    const rooms = store.read();
    return rooms[roomId];
  },
  save(room: ResonanceRoom): ResonanceRoom {
    const rooms = store.read();
    rooms[room.roomId] = room;
    store.write(rooms);
    return room;
  },
};
