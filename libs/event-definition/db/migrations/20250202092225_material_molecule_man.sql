CREATE TYPE "public"."eventDefinitionStatus" AS ENUM('draft', 'ready', 'active', 'archived');--> statement-breakpoint
CREATE TYPE "public"."eventDefinitionType" AS ENUM('crosspromo', 'liveops', 'app', 'ads');--> statement-breakpoint
CREATE TABLE "eventDefinition" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"type" "eventDefinitionType" NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"status" "eventDefinitionStatus" DEFAULT 'draft' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_event_definition_updated_at
BEFORE UPDATE ON "eventDefinition"
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();