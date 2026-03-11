-- Adicionar campos de data de solicitação e data de conclusão na tabela priorities
ALTER TABLE priorities ADD COLUMN requested_date DATE NOT NULL DEFAULT CURRENT_DATE;
ALTER TABLE priorities ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE;
