import type { Stakeholder } from './types';

// Default stakeholders to be used when creating a new project.
export const stakeholders: Record<string, Stakeholder> = {
  dl: { id: 'user-1', name: 'Ing. Mario Rossi', role: 'Direttore dei Lavori (DL)' },
  cse: { id: 'user-2', name: 'Geom. Luca Verdi', role: 'Coordinatore per la Sicurezza (CSE)' },
  impresa: { id: 'user-3', name: 'Paolo Bianchi', role: 'Impresa Esecutrice' },
};

// The application will now start with an empty database.
// Project and log data will be created by the user through the UI.
