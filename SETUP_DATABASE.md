# Configuração do Banco de Dados Supabase

Este documento contém as instruções para configurar o banco de dados Supabase para o Sistema de Gerenciamento de Campeonatos de Futebol.

## Passo 1: Acessar o SQL Editor

1. Acesse o dashboard do Supabase
2. Vá para a seção "SQL Editor"
3. Copie e execute o script SQL abaixo

## Passo 2: Executar o Script de Criação das Tabelas

```sql
-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela de perfis de usuários
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL,
  user_type text NOT NULL DEFAULT 'public' CHECK (user_type IN ('admin', 'public')),
  created_at timestamptz DEFAULT now()
);

-- Tabela de campeonatos
CREATE TABLE IF NOT EXISTS championships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  format text NOT NULL CHECK (format IN ('round_robin', 'single_elimination', 'double_elimination', 'group_knockout')),
  max_teams integer NOT NULL DEFAULT 16,
  points_victory integer NOT NULL DEFAULT 3,
  points_draw integer NOT NULL DEFAULT 1,
  points_defeat integer NOT NULL DEFAULT 0,
  tiebreaker_criteria jsonb DEFAULT '["goal_difference", "goals_for", "head_to_head"]'::jsonb,
  status text NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'finished')),
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

-- Tabela de times
CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  badge_url text,
  city text NOT NULL,
  stadium text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Tabela de jogadores
CREATE TABLE IF NOT EXISTS players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
  name text NOT NULL,
  position text NOT NULL CHECK (position IN ('goalkeeper', 'defender', 'midfielder', 'forward')),
  shirt_number integer NOT NULL CHECK (shirt_number > 0 AND shirt_number <= 99),
  age integer NOT NULL CHECK (age >= 16 AND age <= 50),
  created_at timestamptz DEFAULT now(),
  UNIQUE (team_id, shirt_number)
);

-- Tabela de relacionamento campeonatos-times
CREATE TABLE IF NOT EXISTS championship_teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  championship_id uuid REFERENCES championships(id) ON DELETE CASCADE,
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
  group_name text,
  created_at timestamptz DEFAULT now(),
  UNIQUE (championship_id, team_id)
);

-- Tabela de partidas
CREATE TABLE IF NOT EXISTS matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  championship_id uuid REFERENCES championships(id) ON DELETE CASCADE,
  home_team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
  away_team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
  round integer NOT NULL,
  match_date timestamptz NOT NULL,
  location text NOT NULL,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'finished', 'postponed')),
  home_score integer CHECK (home_score >= 0),
  away_score integer CHECK (away_score >= 0),
  created_at timestamptz DEFAULT now(),
  CHECK (home_team_id != away_team_id)
);

-- Tabela de eventos de partida
CREATE TABLE IF NOT EXISTS match_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid REFERENCES matches(id) ON DELETE CASCADE,
  player_id uuid REFERENCES players(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('goal', 'yellow_card', 'red_card', 'assist')),
  minute integer NOT NULL CHECK (minute >= 0 AND minute <= 150),
  created_at timestamptz DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_players_team_id ON players(team_id);
CREATE INDEX IF NOT EXISTS idx_championship_teams_championship ON championship_teams(championship_id);
CREATE INDEX IF NOT EXISTS idx_championship_teams_team ON championship_teams(team_id);
CREATE INDEX IF NOT EXISTS idx_matches_championship ON matches(championship_id);
CREATE INDEX IF NOT EXISTS idx_matches_home_team ON matches(home_team_id);
CREATE INDEX IF NOT EXISTS idx_matches_away_team ON matches(away_team_id);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_match_events_match ON match_events(match_id);
CREATE INDEX IF NOT EXISTS idx_match_events_player ON match_events(player_id);
CREATE INDEX IF NOT EXISTS idx_teams_name ON teams(name);
CREATE INDEX IF NOT EXISTS idx_championships_status ON championships(status);
```

## Passo 3: Configurar Row Level Security (RLS)

Execute os seguintes comandos para habilitar RLS em todas as tabelas:

```sql
-- Habilitar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE championships ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE championship_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_events ENABLE ROW LEVEL SECURITY;

-- Políticas para profiles
CREATE POLICY "Usuários podem ver próprio perfil"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar próprio perfil"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Políticas para championships
CREATE POLICY "Todos podem ver campeonatos"
  ON championships FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins podem criar campeonatos"
  ON championships FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

CREATE POLICY "Admins podem atualizar campeonatos"
  ON championships FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

CREATE POLICY "Admins podem deletar campeonatos"
  ON championships FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- Políticas para teams
CREATE POLICY "Todos podem ver times"
  ON teams FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins podem criar times"
  ON teams FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

CREATE POLICY "Admins podem atualizar times"
  ON teams FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

CREATE POLICY "Admins podem deletar times"
  ON teams FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- Políticas para players
CREATE POLICY "Todos podem ver jogadores"
  ON players FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins podem criar jogadores"
  ON players FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

CREATE POLICY "Admins podem atualizar jogadores"
  ON players FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

CREATE POLICY "Admins podem deletar jogadores"
  ON players FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- Políticas para championship_teams
CREATE POLICY "Todos podem ver times de campeonatos"
  ON championship_teams FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins podem adicionar times a campeonatos"
  ON championship_teams FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

CREATE POLICY "Admins podem remover times de campeonatos"
  ON championship_teams FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- Políticas para matches
CREATE POLICY "Todos podem ver partidas"
  ON matches FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins podem criar partidas"
  ON matches FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

CREATE POLICY "Admins podem atualizar partidas"
  ON matches FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

CREATE POLICY "Admins podem deletar partidas"
  ON matches FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- Políticas para match_events
CREATE POLICY "Todos podem ver eventos de partida"
  ON match_events FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins podem criar eventos de partida"
  ON match_events FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

CREATE POLICY "Admins podem atualizar eventos de partida"
  ON match_events FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

CREATE POLICY "Admins podem deletar eventos de partida"
  ON match_events FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );
```

## Passo 4: Criar Trigger para Perfis Automáticos

```sql
-- Função para criar perfil automaticamente após registro
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, user_type)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário'), 'public');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## Passo 5: Criar Primeiro Usuário Administrador

Após criar seu primeiro usuário através da interface de cadastro, execute este comando para torná-lo administrador (substitua o email pelo email do usuário):

```sql
UPDATE profiles
SET user_type = 'admin'
WHERE email = 'seu-email@exemplo.com';
```

## Pronto!

Seu banco de dados está configurado e pronto para uso. Você pode agora:

1. Fazer login na aplicação
2. Criar campeonatos
3. Cadastrar times e jogadores
4. Registrar partidas e resultados
5. Visualizar classificações automáticas

## Observações Importantes

- Por padrão, novos usuários são criados como 'public' (somente visualização)
- Apenas administradores podem criar e editar campeonatos, times, jogadores e partidas
- Todos os usuários autenticados podem visualizar dados
- A classificação é calculada automaticamente com base nos resultados das partidas