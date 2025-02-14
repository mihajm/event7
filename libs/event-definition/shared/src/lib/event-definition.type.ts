import { z } from 'zod';

export const EVENT_DEFINITION_TYPES = [
  'ads',
  'app',
  'crosspromo',
  'liveops',
] as const;

export const NO_PERMISSION_EVENT_TYPES = EVENT_DEFINITION_TYPES.filter(
  (type) => type !== 'ads',
);

const eventDefinitionStatusSchema = z.enum([
  'draft',
  'ready',
  'active',
  'archived',
]);
const eventDefinitionTypeSchema = z.enum(EVENT_DEFINITION_TYPES);

const baseCreateSchema = {
  id: z.string().nonempty(),
  name: z.string().nonempty(),
  description: z.string().nonempty(),
  type: eventDefinitionTypeSchema,
  priority: z.number().int().min(0).max(10).optional(),
  status: eventDefinitionStatusSchema.optional(),
} as const;

export const createEventDefinitionSchema = z.object({
  ...baseCreateSchema,
  id: baseCreateSchema.id.optional(),
});

export const getSchema = {
  ...baseCreateSchema,
  name: baseCreateSchema.name.optional(),
  description: baseCreateSchema.description.optional(),
  type: baseCreateSchema.type.optional(),
  createdAt: z.date().or(z.string()).optional(),
  updatedAt: z.date().or(z.string()).optional(),
} as const;

export const eventDefinitionSchema = z.object(getSchema);

export const updateEventDefinitionSchema = z.object({
  id: baseCreateSchema.id.optional(),
  name: getSchema.name.nullable(),
  description: getSchema.description.nullable(),
  type: getSchema.type.nullable(),
  priority: getSchema.priority,
  status: getSchema.status,
  createdAt: getSchema.createdAt,
  updatedAt: getSchema.updatedAt,
});

export type EventDefinitionType = z.infer<typeof eventDefinitionTypeSchema>;
export type EventDefinitionStatus = z.infer<typeof eventDefinitionStatusSchema>;
export type EventDefinition = z.infer<typeof eventDefinitionSchema>;

export type CreateEventDefinitionDTO = z.infer<
  typeof createEventDefinitionSchema
>;

export type UpdateEventDefinitionDTO = z.infer<
  typeof updateEventDefinitionSchema
>;

export type EventDefinitionChangeEvent = {
  value: Omit<EventDefinition, 'type'> & {
    type: Required<EventDefinition>['type'];
  };
  clientId?: string;
  type: 'create' | 'update';
};
