-- Remap legacy UUID social_links.id values to 8-char alphanumeric IDs.
-- link_analytics.linkId follows via ON UPDATE CASCADE.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  r RECORD;
  new_id TEXT;
  alphabet CONSTANT TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  i INT;
BEGIN
  FOR r IN
    SELECT id
    FROM social_links
    WHERE id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  LOOP
    LOOP
      new_id := '';
      FOR i IN 1..8 LOOP
        new_id := new_id || substr(
          alphabet,
          1 + (get_byte(gen_random_bytes(1), 0) % 62),
          1
        );
      END LOOP;
      EXIT WHEN NOT EXISTS (SELECT 1 FROM social_links WHERE id = new_id);
    END LOOP;

    UPDATE social_links SET id = new_id WHERE id = r.id;
  END LOOP;
END $$;
