import { worlds as originalWorlds } from './destiny-legacy-data.js';
import { additionalWorlds, settings } from './destiny-worlds.js';
export const worlds = [...originalWorlds, ...additionalWorlds].map(world => ({ ...world, story: settings[world.id] }));
export const statNames = { courage: 'Valor', cunning: 'Ingenio', bonds: 'Vínculos', energy: 'Reserva' };
export const durations = [
  { id: 'short', name: 'Un destello', time: 'Menos de 3 min', decisions: 6, description: 'Una misión directa. Cada decisión pesa.', sequence: ['origin','skill','mission','branch','crisis','finale'] },
  { id: 'standard', name: 'Un episodio', time: '≈ 7 min', decisions: 12, description: 'Conoce a tu compañero, investiga y afronta las consecuencias.', sequence: ['origin','skill','promise','mission','branch','companion','camp','clue','trap','crisis','aftermath','finale'] },
  { id: 'long', name: 'Una saga', time: '≈ 15 min', decisions: 22, description: 'Diálogos, secretos, preparación y decisiones que dejan cicatrices.', sequence: ['origin','skill','promise','memory','training','mission','travel','branch','companion','camp','dialogue','clue','pact','trap','triage','scout2','enemy','crossroads','crisis','aftermath','reckoning','finale'] },
];
export const fateLabels = { triumph: 'Victoria sin heridas', guardian: 'Victoria con cicatrices', strategist: 'Victoria estratégica', loss: 'El precio de la pérdida', sacrifice: 'Tu último acto', fallen: 'El final de tu camino', retreat: 'Vivir para volver' };
export const fateArt = fate => fate === 'retreat' ? 'guardian' : fate;
