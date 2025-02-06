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
  failedToFetch: 'Failed to fetch event definitions',
  failedToFetchTypes: 'Failed to fetch definition types',
  failedToUpdate: 'Failed to update event definition: {name}',
  failedToCreate: 'Failed to create event definition: {name}',
  createdWithPriority: 'Created {date} with priority',
  currentlyOpenEventWasArchived:
    'The currently open event was archived by another user',
  currentlyOpenEventWasUpdated:
    'The currently open event was updated by another user, your changes have been preserved',
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
