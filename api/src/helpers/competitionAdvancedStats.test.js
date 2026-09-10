import { describe, expect, it } from "vitest";
import { computePredecessorStats, computeRecords, computeNetVsGross } from "./competitionAdvancedStats.js";

const dog = (name, over = {}) => ({ name, faulted: false, crossTime: null, time: null, ...over });

describe("computePredecessorStats", () => {
  it("groups each dog's changeover and run time by the dog before it", () => {
    const entries = [
      { dogs: [dog("A"), dog("B", { crossTime: 0.2, time: 4.1 }), dog("C", { crossTime: 0.4 }), dog("D", { crossTime: 0.1 })] },
      { dogs: [dog("A"), dog("C", { crossTime: 0.3 }), dog("B", { crossTime: 0.5, faulted: true }), dog("D", { crossTime: "ok" })] },
    ];

    const stats = computePredecessorStats(entries);
    const bAfterA = stats.find((row) => row.dog === "B" && row.predecessor === "A");
    const bAfterC = stats.find((row) => row.dog === "B" && row.predecessor === "C");

    expect(bAfterA).toMatchObject({ heats: 1, faultCount: 0, avgCrossTime: 0.2, avgRunTime: 4.1 });
    expect(bAfterC).toMatchObject({ heats: 1, faultCount: 1, faultRate: 1 });
    // "ok" changeover code counts as 0.10s.
    expect(stats.find((row) => row.dog === "D" && row.predecessor === "B")).toMatchObject({ okCount: 1, avgCrossTime: 0.1 });
  });

  it("ignores the lead dog and rows with a missing name", () => {
    const stats = computePredecessorStats([{ dogs: [dog("A"), dog(""), dog("C", { crossTime: 0.2 })] }]);

    expect(stats).toEqual([]);
  });
});

describe("computeRecords", () => {
  const entries = [
    { eventId: "e1", teamName: "Alpha", division: 2, teamNetTime: 17.5, dogs: [dog("A", { time: 5 }), dog("B", { time: 4 }), dog("C", { time: 4 }), dog("D", { time: 4.5 })] },
    { eventId: "e2", teamName: "Alpha", division: 1, teamNetTime: 16.9, dogs: [dog("A", { time: 4.8 }), dog("B", { time: 3.9 }), dog("C", { time: 4.1 }), dog("D", { time: 4.1 })] },
    { eventId: "e2", teamName: "Alpha", division: 1, teamNetTime: 16.0, dogs: [dog("A", { time: 4.7, faulted: true }), dog("B", { time: 3.8 }), dog("C", { time: 4 }), dog("D", { time: 4 })] },
    { eventId: "e2", teamName: "Beta", division: 3, teamNetTime: 20.1, dogs: [dog("E", { time: 6 }), dog("F", { time: 5 }), dog("G", { time: 5 }), dog("H", { time: 4 })] },
  ];

  it("takes the fastest clean team net time per team and names where it fell", () => {
    const { teamBests } = computeRecords(entries, { e2: "Regionals" });

    expect(teamBests).toEqual([
      expect.objectContaining({ teamName: "Alpha", value: 16.9, division: 1, eventName: "Regionals", dogs: ["A", "B", "C", "D"] }),
      expect.objectContaining({ teamName: "Beta", value: 20.1, dogs: ["E", "F", "G", "H"] }),
    ]);
  });

  it("ignores a faster net time from a heat that needed a rerun", () => {
    const withRerun = [
      ...entries,
      { eventId: "e3", teamName: "Alpha", division: 1, teamNetTime: 14.8, extraPasses: [{ time: 4.5, dogIndex: 1 }], dogs: [dog("A", { time: 4 }), dog("B", { time: 3 }), dog("C", { time: 3.5 }), dog("D", { time: 3.8 })] },
    ];

    expect(computeRecords(withRerun, {}).teamBests.find((row) => row.teamName === "Alpha").value).toBe(16.9);
  });

  it("takes each dog's fastest clean solo run, faulted heats excluded", () => {
    const { dogBests } = computeRecords(entries, {});
    const a = dogBests.find((row) => row.dog === "A");

    expect(a.value).toBe(4.8);
  });

  it("ignores sub-2s 'times' - those are mis-parsed changeover cells, not run times", () => {
    const { dogBests } = computeRecords(
      [{ eventId: "e1", teamName: "Alpha", teamNetTime: 17, dogs: [dog("A", { time: -0.12 }), dog("B", { time: 4.5 }), dog("C", { time: 4 }), dog("D", { time: 4 })] }],
      {}
    );

    expect(dogBests.find((row) => row.dog === "A")).toBeUndefined();
    expect(dogBests.find((row) => row.dog === "B").value).toBe(4.5);
  });
});

describe("computeNetVsGross", () => {
  it("averages gross, net, start overhead and changeover overlap per team, over clean heats", () => {
    const entries = [
      { teamName: "Alpha", teamTime: 18.2, teamNetTime: 17.5, dogs: [dog("A", { time: 5 }), dog("B", { time: 5 }), dog("C", { time: 5 }), dog("D", { time: 5 })] },
      { teamName: "Beta", teamTime: 21, teamNetTime: 20, dogs: [dog("E", { time: 6 }), dog("F", { time: 6 }), dog("G", { time: 6 }), dog("H", { time: 6 })] },
    ];

    const [alpha, beta] = computeNetVsGross(entries);

    expect(alpha).toMatchObject({ teamName: "Alpha", heats: 1, avgGross: 18.2, avgNet: 17.5 });
    expect(alpha.avgStartOverhead).toBeCloseTo(0.7);
    expect(alpha.avgOverlap).toBeCloseTo(20 - 17.5);
    expect(beta).toMatchObject({ teamName: "Beta", avgNet: 20 });
  });

  it("returns an empty array when no heat is clean", () => {
    expect(computeNetVsGross([{ teamName: "Alpha", teamNetTime: 17, dogs: [dog("A", { faulted: true })] }])).toEqual([]);
  });
});
