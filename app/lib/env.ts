
import { createContext } from 'react-router';

export type Env = {
  RESEND_API_KEY: string;

  // Conserva aquí las demás variables
  // de entorno que utiliza tu proyecto.
};

export const envContext = createContext<Env>();
