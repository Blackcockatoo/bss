import { randomUUID } from "node:crypto";
import { resonanceRoomRepository } from "../repositories/resonanceRoomRepository";

export type RoomRole = "viewer" | "editor";

export type RoomMember = {
  userId: string;
  role: RoomRole;
  cursor?: { x: number; y: number };
};

export type InviteLink = {
  code: string;
  role: RoomRole;
  createdBy: string;
  createdAt: string;
  expiresAt: string;
  revokedAt?: string;
};

export type Snapshot = {
  id: string;
  createdAt: string;
  createdBy: string;
  note: string;
  roomVersion: number;
};

export type ResonanceRoom = {
  roomId: string;
  inviteCode: string;
  members: RoomMember[];
  snapshots: Snapshot[];
  inviteLinks: InviteLink[];
  version: number;
  createdAt: string;
  updatedAt: string;
};

function nextInviteCode(): string {
  return Math.random().toString(36).slice(2, 8);
}

export function createRoom(roomId: string, createdBy = "system"): ResonanceRoom {
  const now = new Date().toISOString();
  const room: ResonanceRoom = {
    roomId,
    inviteCode: nextInviteCode(),
    members: [{ userId: createdBy, role: "editor" }],
    snapshots: [],
    inviteLinks: [],
    version: 1,
    createdAt: now,
    updatedAt: now,
  };
  return resonanceRoomRepository.save(room);
}

function assertRole(actorRole: RoomRole, requiredRole: RoomRole): void {
  if (actorRole !== "editor" && requiredRole === "editor") {
    throw new Error("Insufficient room permissions");
  }
}

function resolveRoom(roomId: string): ResonanceRoom {
  return resonanceRoomRepository.findByRoomId(roomId) ?? createRoom(roomId);
}

function resolveInvite(room: ResonanceRoom, inviteCode: string): InviteLink {
  const invite = room.inviteLinks.find((item) => item.code === inviteCode);
  if (!invite) {
    throw new Error("Invite not found");
  }
  if (invite.revokedAt) {
    throw new Error("Invite has been revoked");
  }
  if (Date.parse(invite.expiresAt) <= Date.now()) {
    throw new Error("Invite has expired");
  }
  return invite;
}

export function createInviteLink(
  roomId: string,
  createdBy: string,
  creatorRole: RoomRole,
  role: RoomRole,
  expiresInMinutes = 60,
): InviteLink {
  assertRole(creatorRole, "editor");
  const room = resolveRoom(roomId);
  const now = new Date();
  const invite: InviteLink = {
    code: nextInviteCode(),
    role,
    createdBy,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + expiresInMinutes * 60 * 1000).toISOString(),
  };

  room.inviteLinks.push(invite);
  room.version += 1;
  room.updatedAt = new Date().toISOString();
  resonanceRoomRepository.save(room);
  return invite;
}

export function revokeInviteLink(
  roomId: string,
  inviteCode: string,
  actorRole: RoomRole,
): ResonanceRoom {
  assertRole(actorRole, "editor");
  const room = resolveRoom(roomId);
  const invite = resolveInvite(room, inviteCode);
  invite.revokedAt = new Date().toISOString();
  room.version += 1;
  room.updatedAt = new Date().toISOString();
  return resonanceRoomRepository.save(room);
}

export function joinRoom(roomId: string, userId: string, inviteCode?: string): ResonanceRoom {
  const room = resolveRoom(roomId);
  const role = inviteCode ? resolveInvite(room, inviteCode).role : "viewer";
  const existing = room.members.find((member) => member.userId === userId);

  if (!existing) {
    room.members.push({ userId, role });
  } else {
    existing.role = role;
  }

  room.version += 1;
  room.updatedAt = new Date().toISOString();
  return resonanceRoomRepository.save(room);
}

export function updateMemberRole(
  roomId: string,
  actorRole: RoomRole,
  targetUserId: string,
  nextRole: RoomRole,
): ResonanceRoom {
  assertRole(actorRole, "editor");
  const room = resolveRoom(roomId);
  const member = room.members.find((item) => item.userId === targetUserId);
  if (!member) {
    throw new Error("Member not found");
  }

  member.role = nextRole;
  room.version += 1;
  room.updatedAt = new Date().toISOString();
  return resonanceRoomRepository.save(room);
}

export function exportSnapshot(roomId: string, createdBy: string, actorRole: RoomRole, note: string): Snapshot {
  assertRole(actorRole, "editor");
  const room = resonanceRoomRepository.findByRoomId(roomId);
  if (!room) {
    throw new Error("Room not found");
  }

  const snapshot: Snapshot = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    createdBy,
    note,
    roomVersion: room.version,
  };
  room.snapshots.push(snapshot);
  room.version += 1;
  room.updatedAt = new Date().toISOString();
  resonanceRoomRepository.save(room);
  return snapshot;
}
