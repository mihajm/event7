import { createNamespace } from '@e7/common/locale';

const ns = createNamespace('eventDef', {
  event: 'Event',
  events: 'Events',
  type: 'Type',
  name: 'Name',
  description: 'Description',
  priority: 'Priority',
  created: 'Created',
  updated: 'Updated',
  status: 'Status',
  createEventDefinition: 'Create Event Definition',
} as const);

export default ns.translation;
export const createEventDefTranslation = ns.createTranslation;
