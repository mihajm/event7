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
  createEventDefinition: 'Create event definition',
  archiveEventDefinition: 'Archive event definition',
  modifyEventDefinition: 'Modify event definition',
  actions: 'Actions',
  youWantToArchiveThisEvent: 'Confirming will archive this definition',
  eventStatus: {
    active: 'Active',
    archived: 'Archived',
    draft: 'Draft',
    ready: 'Ready',
  },
  types: {
    crosspromo: 'Crosspromo',
    liveops: 'Liveops',
    app: 'App',
    ads: 'Ads',
  },
} as const);

export default ns.translation;
export const createEventDefTranslation = ns.createTranslation;
