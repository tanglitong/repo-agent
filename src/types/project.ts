export interface ProjectProfile {
  root: string;
  language: string[];
  framework: string[];
  packageManager?: string;
  testCommands: {
    unit?: string;
    typecheck?: string;
    lint?: string;
    specValidate?: string;
  };
  process: {
    hasOpenSpec: boolean;
    openSpecRoot?: string;
    hasAdr: boolean;
    adrRoot?: string;
    hasAgents: boolean;
    hasSecurity: boolean;
    hasCiWorkflows: boolean;
  };
  riskPaths: string[];
}
