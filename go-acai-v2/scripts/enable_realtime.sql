-- Execute no Supabase Dashboard → SQL Editor
-- Habilita Realtime na tabela orders para o admin receber pedidos em tempo real

-- Verificar se a publicação já existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    CREATE PUBLICATION supabase_realtime FOR TABLE orders;
  ELSE
    ALTER PUBLICATION supabase_realtime ADD TABLE orders;
  END IF;
END $$;
