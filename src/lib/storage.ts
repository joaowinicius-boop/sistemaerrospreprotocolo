export interface ErrorReport {
  id: string;
  clientName: string;
  processId: string;
  description: string;
  reportedBy: string;
  status: "Pendente" | "Em Análise" | "Resolvido";
  solutionResponsible: string;
  createdAt: string;
}

const ERRORS_KEY = "ng_errors";
const TEAM_KEY = "ng_team_members";

export function getErrors(): ErrorReport[] {
  const data = localStorage.getItem(ERRORS_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveErrors(errors: ErrorReport[]) {
  localStorage.setItem(ERRORS_KEY, JSON.stringify(errors));
}

export function addError(error: Omit<ErrorReport, "id" | "createdAt" | "status" | "solutionResponsible">): ErrorReport {
  const errors = getErrors();
  const newError: ErrorReport = {
    ...error,
    id: crypto.randomUUID(),
    status: "Pendente",
    solutionResponsible: "",
    createdAt: new Date().toISOString(),
  };
  errors.unshift(newError);
  saveErrors(errors);
  return newError;
}

export function updateError(id: string, updates: Partial<ErrorReport>) {
  const errors = getErrors().map((e) => (e.id === id ? { ...e, ...updates } : e));
  saveErrors(errors);
}

export function deleteError(id: string) {
  saveErrors(getErrors().filter((e) => e.id !== id));
}

export function getTeamMembers(): string[] {
  const data = localStorage.getItem(TEAM_KEY);
  return data ? JSON.parse(data) : ["EMERSON", "SANDRA", "MATEUS"];
}

export function saveTeamMembers(members: string[]) {
  localStorage.setItem(TEAM_KEY, JSON.stringify(members));
}
