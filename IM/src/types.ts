export interface ValidationReport {
  validationScore: {
    total: number;
    breakdown: {
      marketDemand: number;
      competition: number;
      feasibility: number;
      revenue: number;
      innovation: number;
    };
    reasoning: string;
  };
  marketDemand: string;
  competitiveLandscape: string;
  feasibility: string;
  revenuePotential: string;
  innovationAngle: string;
  swot: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
  mvpSuggestions: {
    approach: string;
    description: string;
    hypothesis: string;
    successSignal: string;
  }[];
  verdict: {
    recommendation: "Pursue" | "Pivot" | "Kill";
    reasoning: string;
  };
  relatedLinks?: {
    title: string;
    url: string;
    type: "article" | "competitor";
  }[];
}

export interface SavedReport extends ValidationReport {
  id: string;
  idea: string;
  createdAt: number;
  isPublic: boolean;
  authorId: string;
  authorName: string;
  authorPhoto: string;
}
