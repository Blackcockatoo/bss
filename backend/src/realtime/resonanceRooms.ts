export type RoomRole = "viewer" | "editor";

export type RoomMember = {
  userId: string;
  role: RoomRole;
  cursor?: { x: number; y: number };
};

export type ResonanceRoom = {
  roomId: string;
  inviteCode: string;
  members: RoomMember[];
  snapshots: Array<{ id: string; createdAt: string; note: string }>;
};

const rooms = new Map<string, ResonanceRoom>();

export function createRoom(roomId: string): ResonanceRoom {
  const room: ResonanceRoom = {
    roomId,
    inviteCode: Math.random().toString(36).slice(2, 8),
    members: [],
    snapshots: [],
  };
  rooms.set(roomId, room);
  return room;
}

export function joinRoom(roomId: string, userId: string, role: RoomRole): ResonanceRoom {
  const room = rooms.get(roomId) ?? createRoom(roomId);
  if (!room.members.find((member) => member.userId === userId)) {
    room.members.push({ userId, role });
  }
  return room;
}

export function exportSnapshot(roomId: string, note: string) {
  const room = rooms.get(roomId);
  if (!room) {
    throw new Error("Room not found");
  }

  const snapshot = {
    id: `${roomId}-${room.snapshots.length + 1}`,
    createdAt: new Date().toISOString(),
    note,
  };
  room.snapshots.push(snapshot);
  return snapshot;
}
