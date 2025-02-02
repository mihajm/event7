import { z } from 'zod';

const eventDefinitionStatusSchema = z.enum([
  'draft',
  'ready',
  'active',
  'archived',
]);
const eventDefinitionTypeSchema = z.enum([
  'crosspromo',
  'liveops',
  'app',
  'ads',
]);

const baseCreateSchema = {
  id: z.string(),
  name: z.string(),
  description: z.string(),
  type: eventDefinitionTypeSchema,
  priority: z.number().optional(),
  status: eventDefinitionStatusSchema.optional(),
} as const;

const createEventDefinitionSchema = z.object(baseCreateSchema);

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
  ...getSchema,
  id: getSchema.id.optional(),
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
