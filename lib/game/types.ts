export type Team = "a" | "b";

export type RoomStatus = "aguardando" | "em_andamento" | "finalizado";
export type GameStatus =
  | "aguardando"
  | "aguardando_respostas"
  | "revelada"
  | "finalizado";

export interface Player {
  id: string;
  room_id: string;
  name: string;
  team: Team | null;
  is_host: boolean;
  connected: boolean;
  chips: number;
  avatar: string | null;
  ready: boolean;
  reconnect_token: string;
  created_at: string;
}

export interface Room {
  id: string;
  code: string;
  status: RoomStatus;
  host_player_id: string | null;
  max_players: number;
  created_at: string;
}

export interface Question {
  id: string;
  room_id: string;
  question: string;
  mode: "comparativa";
  category: string | null;
  created_at: string;
}

export interface Game {
  id: string;
  room_id: string;
  status: GameStatus;
  current_team: Team;
  team_a_position: number;
  team_b_position: number;
  board_size: number;
  current_question_id: string | null;
  player_1_id: string | null;
  player_2_id: string | null;
  bet_1: number | null;
  bet_2: number | null;
  answer_1: string | null;
  answer_2: string | null;
  answer_1_at: string | null;
  answer_2_at: string | null;
  winner_team: Team | null;
  skip_team: Team | null;
  version: number;
  updated_at: string;
}

export interface Move {
  id: string;
  game_id: string;
  team: Team;
  question_id: string | null;
  player_1_id: string;
  player_2_id: string;
  bet_1: number;
  bet_2: number;
  answer_1: string;
  answer_2: string;
  correct: boolean;
  spaces_moved: number;
  special_effect: string | null;
  created_at: string;
}

export interface QuestionBankItem {
  id: string;
  question: string;
  category: string | null;
  active: boolean;
  created_at: string;
}

export interface GameState {
  room: Room;
  players: Player[];
  game: Game | null;
  question: Question | null;
  moves: Move[];
}
