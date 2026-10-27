export type Phase = 'ready' | 'playing' | 'paused' | 'dead' | 'won';
export interface Input { axis: number; jump: boolean; attack: boolean }
export interface Body { x: number; y: number; vx: number; vy: number; grounded: boolean }
export interface Player extends Body { hp: number; facing: number; invulnerable: number; attack: number; cooldown: number; coyote: number; buffer: number; attackId: number }
export interface Enemy { x: number; y: number; home: number; hp: number; facing: number; mode: 'patrol' | 'windup' | 'charge' | 'recover' | 'dead'; timer: number; hitBy: number }
export interface Platform { x: number; width: number; y: number; depth: number }
export interface GameState { phase: Phase; player: Player; enemies: Enemy[]; time: number; kills: number; bestX: number; deaths: number }
