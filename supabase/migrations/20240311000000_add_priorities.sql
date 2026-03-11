-- Create priorities table
CREATE TABLE IF NOT EXISTS priorities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_name TEXT NOT NULL,
    process_id TEXT NOT NULL,
    current_sector TEXT NOT NULL CHECK (current_sector IN ('Pendência', 'Organização de Documentos', 'Peticionamento', 'Protocolo')),
    responsible_name TEXT,
    deadline TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- RLS Policies
ALTER TABLE priorities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON priorities FOR SELECT USING (true);
CREATE POLICY "Enable insert access for authenticated users" ON priorities FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Enable update access for all users" ON priorities FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON priorities FOR DELETE USING (true);
