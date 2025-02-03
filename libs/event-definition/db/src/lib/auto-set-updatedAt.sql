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