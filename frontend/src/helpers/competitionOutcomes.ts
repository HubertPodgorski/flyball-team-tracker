import { CompetitionDogStats } from "./types";

export interface OutcomeTotals {
  totalPasses: number;
  faultCount: number;
  okCount: number;
  cleanRestCount: number;
  okByText: Record<string, number>;
}

// Every pass falls into exactly one of fault / ok (further split by exact text) / clean-rest (a real numeric pass, not faulted, not "ok") - the pie chart's three buckets.
export const aggregateOutcomes = (dogs: CompetitionDogStats[]): OutcomeTotals => {
  const totalPasses = dogs.reduce((sum, dog) => sum + dog.totalPasses, 0);
  const faultCount = dogs.reduce((sum, dog) => sum + dog.faultCount, 0);
  const okByText: Record<string, number> = {};

  dogs.forEach((dog) => {
    Object.entries(dog.okByText).forEach(([text, count]) => {
      okByText[text] = (okByText[text] || 0) + count;
    });
  });

  const okCount = Object.values(okByText).reduce((sum, count) => sum + count, 0);

  return { totalPasses, faultCount, okCount, cleanRestCount: totalPasses - faultCount - okCount, okByText };
};
