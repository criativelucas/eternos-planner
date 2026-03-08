-- Create wedding_config table
CREATE TABLE public.wedding_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome_noiva TEXT NOT NULL DEFAULT 'Ana',
  nome_noivo TEXT NOT NULL DEFAULT 'Pedro',
  data_casamento DATE NOT NULL DEFAULT '2026-11-14',
  orcamento_total NUMERIC NOT NULL DEFAULT 45000,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create wedding_items table
CREATE TABLE public.wedding_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  categoria TEXT NOT NULL DEFAULT 'Outros',
  fornecedor TEXT,
  valor_total NUMERIC NOT NULL DEFAULT 0,
  valor_pago NUMERIC NOT NULL DEFAULT 0,
  parcelas JSONB NOT NULL DEFAULT '[]'::jsonb,
  prazo DATE,
  status TEXT NOT NULL DEFAULT 'pendente',
  prioridade TEXT NOT NULL DEFAULT 'media',
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.wedding_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wedding_items ENABLE ROW LEVEL SECURITY;

-- Allow public access (no auth yet)
CREATE POLICY "Allow all access to wedding_config" ON public.wedding_config FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to wedding_items" ON public.wedding_items FOR ALL USING (true) WITH CHECK (true);

-- Timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_wedding_config_updated_at
  BEFORE UPDATE ON public.wedding_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_wedding_items_updated_at
  BEFORE UPDATE ON public.wedding_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default config
INSERT INTO public.wedding_config (nome_noiva, nome_noivo, data_casamento, orcamento_total)
VALUES ('Ana', 'Pedro', '2026-11-14', 45000);

-- Insert seed data
INSERT INTO public.wedding_items (nome, categoria, fornecedor, valor_total, valor_pago, parcelas, prazo, status, prioridade, notas) VALUES
('Buffet Completo', 'Buffet', 'Buffet Elegance', 15000, 5000, '[{"numero":1,"valor":5000,"dataVencimento":"2026-03-15","pago":true},{"numero":2,"valor":5000,"dataVencimento":"2026-06-15","pago":false},{"numero":3,"valor":5000,"dataVencimento":"2026-09-15","pago":false}]'::jsonb, '2026-10-01', 'em_andamento', 'alta', 'Menu degustação agendado para abril'),
('Fotografia e Vídeo', 'Foto/Vídeo', 'Studio Luz', 4500, 1500, '[{"numero":1,"valor":1500,"dataVencimento":"2026-02-01","pago":true},{"numero":2,"valor":1500,"dataVencimento":"2026-05-01","pago":false},{"numero":3,"valor":1500,"dataVencimento":"2026-08-01","pago":false}]'::jsonb, '2026-06-01', 'em_andamento', 'alta', null),
('Vestido de Noiva', 'Vestuário', 'Atelier Rosa', 3200, 0, '[]'::jsonb, '2026-08-01', 'em_andamento', 'media', 'Primeira prova em maio'),
('Decoração Floral', 'Flores', 'Flores & Arte', 2800, 2800, '[{"numero":1,"valor":2800,"dataVencimento":"2026-02-20","pago":true}]'::jsonb, '2026-11-10', 'concluido', 'media', 'Peônias e rosas brancas confirmadas'),
('DJ e Sonorização', 'Música', 'DJ Marcos', 2000, 500, '[{"numero":1,"valor":500,"dataVencimento":"2026-03-01","pago":true},{"numero":2,"valor":500,"dataVencimento":"2026-06-01","pago":false},{"numero":3,"valor":500,"dataVencimento":"2026-09-01","pago":false},{"numero":4,"valor":500,"dataVencimento":"2026-11-01","pago":false}]'::jsonb, '2026-07-01', 'em_andamento', 'baixa', null),
('Convites Personalizados', 'Convites', 'Papelaria Fina', 800, 800, '[{"numero":1,"valor":800,"dataVencimento":"2026-01-30","pago":true}]'::jsonb, '2026-04-01', 'concluido', 'baixa', '200 unidades, papel vergê');