export type UserType = 'admin' | 'public';

export type ChampionshipFormat =
  | 'round_robin'
  | 'single_elimination'
  | 'double_elimination'
  | 'group_knockout';

export type ChampionshipStatus = 'upcoming' | 'active' | 'finished';

export type MatchStatus = 'scheduled' | 'in_progress' | 'finished' | 'postponed';

export type PlayerPosition = 'goalkeeper' | 'defender' | 'midfielder' | 'forward';

export type EventType = 'goal' | 'yellow_card' | 'red_card' | 'assist';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  user_type: UserType;
  created_at: string;
}

export interface Championship {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  format: ChampionshipFormat;
  max_teams: number;
  points_victory: number;
  points_draw: number;
  points_defeat: number;
  tiebreaker_criteria: string[];
  status: ChampionshipStatus;
  created_by: string;
  created_at: string;
}

export interface Team {
  id: string;
  name: string;
  badge_url?: string;
  city: string;
  stadium: string;
  created_at: string;
}

export interface Player {
  id: string;
  team_id: string;
  name: string;
  position: PlayerPosition;
  shirt_number: number;
  age: number;
  created_at: string;
}

export interface ChampionshipTeam {
  id: string;
  championship_id: string;
  team_id: string;
  group_name?: string;
  created_at: string;
}

export interface Match {
  id: string;
  championship_id: string;
  home_team_id: string;
  away_team_id: string;
  round: number;
  match_date: string;
  location: string;
  status: MatchStatus;
  home_score?: number;
  away_score?: number;
  created_at: string;
}

export interface MatchEvent {
  id: string;
  match_id: string;
  player_id: string;
  event_type: EventType;
  minute: number;
  created_at: string;
}

export interface StandingsEntry {
  position: number;
  team: Team;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
}

export interface TopScorer {
  player: Player;
  team: Team;
  goals: number;
  assists: number;
}

export interface MatchWithTeams extends Match {
  home_team: Team;
  away_team: Team;
}