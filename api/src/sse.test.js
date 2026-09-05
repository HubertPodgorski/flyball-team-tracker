import { describe, expect, it, vi } from "vitest";
import sse from "./sse.js";

const { addClient, removeClient, broadcast } = sse;

// A minimal fake response - only what broadcast() actually touches.
const fakeRes = (write) => ({ write });

describe("broadcast", () => {
  it("delivers to every registered client for that team", () => {
    const club = `club-${Date.now()}-a`;
    const received = [];

    addClient(club, fakeRes((payload) => received.push(payload)));
    addClient(club, fakeRes((payload) => received.push(payload)));

    broadcast(club, "teams_updated", { hello: "world" });

    expect(received).toHaveLength(2);
    expect(received[0]).toContain("event: teams_updated");
    expect(received[0]).toContain(JSON.stringify({ hello: "world" }));
  });

  it("does nothing for a team with no registered clients", () => {
    expect(() => broadcast(`club-${Date.now()}-none`, "teams_updated", {})).not.toThrow();
  });

  it("never delivers to a client after it's been removed", () => {
    const club = `club-${Date.now()}-b`;
    const write = vi.fn();
    const res = fakeRes(write);

    addClient(club, res);
    removeClient(club, res);
    broadcast(club, "teams_updated", {});

    expect(write).not.toHaveBeenCalled();
  });

  // The real bug this file exists to catch - see broadcast()'s own comment.
  it("a stale client's write throwing does not stop the broadcast reaching the clients after it", () => {
    const club = `club-${Date.now()}-c`;
    const staleWrite = vi.fn(() => {
      throw new Error("ERR_STREAM_WRITE_AFTER_END");
    });
    const liveWrite = vi.fn();

    addClient(club, fakeRes(staleWrite));
    addClient(club, fakeRes(liveWrite));

    expect(() => broadcast(club, "teams_updated", {})).not.toThrow();
    expect(liveWrite).toHaveBeenCalledTimes(1);
  });

  it("self-heals - a client whose write throws once is not retried on the next broadcast", () => {
    const club = `club-${Date.now()}-d`;
    const write = vi.fn(() => {
      throw new Error("ERR_STREAM_WRITE_AFTER_END");
    });

    addClient(club, fakeRes(write));

    broadcast(club, "teams_updated", {});
    broadcast(club, "teams_updated", {});

    expect(write).toHaveBeenCalledTimes(1);
  });
});
