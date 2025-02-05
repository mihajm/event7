import { createEventDefTranslation } from './event-definition.namespace';

export default createEventDefTranslation('sl-SI', {
  event: 'Dogodek',
  events: 'Dogodki',
  type: 'Tip',
  name: 'Ime',
  description: 'Opis',
  priority: 'Prioriteta',
  created: 'Ustvarjeno',
  updated: 'Posodobljeno',
  status: 'Status',
  createEventDefinition: 'Ustvari definicijo dogodka',
  archiveEventDefinition: 'Arhiviraj definicijo dogodka',
  modifyEventDefinition: 'Uredi definicijo dogodka',
  youWantToArchiveThisEvent: 'Potrditev bo arhivirala to definicijo',
  actions: 'Akcije',
  failedToFetch: 'Nalaganje definicij dogodkov ni uspelo',
  failedToFetchTypes: 'Nalaganje tipov definicij ni uspelo',
  failedToUpdate: 'Posodabljanje definicije dogodka {name} ni uspelo',
  failedToCreate: 'Ustvarjanje definicije dogodka {name} ni uspelo',
  eventStatus: {
    active: 'Aktivno',
    archived: 'Arhivirano',
    draft: 'Osnutek',
    ready: 'Pripravljeno',
  },
  types: {
    crosspromo: 'Križna promocija',
    liveops: 'Dogodki v živo',
    app: 'Aplikacija',
    ads: 'Oglasi',
  },
});
