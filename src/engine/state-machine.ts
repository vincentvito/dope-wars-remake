import type { GamePhase, PlayerAction, ProPlayerAction } from './types';

/**
 * Valid phase transitions.
 */
const VALID_TRANSITIONS: Record<GamePhase, GamePhase[]> = {
  market:     ['traveling', 'game_over'],
  traveling:  ['event', 'combat', 'market'],
  event:      ['combat', 'market', 'game_over'],
  combat:     ['market', 'game_over', 'loadout'],
  lab:        ['market', 'loadout', 'combat'],
  loadout:    ['combat'],
  game_over:  [],
};

/**
 * Valid actions per game phase (classic mode).
 */
const VALID_ACTIONS: Record<GamePhase, PlayerAction['type'][]> = {
  market:     ['BUY', 'SELL', 'TRAVEL', 'BANK_DEPOSIT', 'BANK_WITHDRAW', 'PAY_DEBT'],
  traveling:  [],
  event:      ['EVENT_ACCEPT', 'EVENT_DECLINE'],
  combat:     ['COMBAT_RUN', 'COMBAT_FIGHT'],
  lab:        [],
  loadout:    [],
  game_over:  [],
};

/**
 * Valid actions per game phase (pro mode).
 */
const VALID_PRO_ACTIONS: Record<GamePhase, ProPlayerAction['type'][]> = {
  market:     ['BUY', 'SELL', 'TRAVEL', 'BANK_DEPOSIT', 'BANK_WITHDRAW', 'PAY_DEBT',
               'BUY_ASSET', 'CUT_DRUGS', 'DISCARD_WEAPON'],
  traveling:  [],
  event:      ['EVENT_ACCEPT', 'EVENT_DECLINE'],
  combat:     ['COMBAT_RUN', 'COMBAT_FIGHT'],
  lab:        ['LAB_CONFIRM', 'LAB_CANCEL'],
  loadout:    ['SELECT_LOADOUT'],
  game_over:  [],
};

/**
 * Check if a player action is valid in the current game phase (classic mode).
 */
export function isValidAction(phase: GamePhase, actionType: PlayerAction['type']): boolean {
  return VALID_ACTIONS[phase]?.includes(actionType) ?? false;
}

/**
 * Check if a pro player action is valid in the current game phase.
 */
export function isValidProAction(phase: GamePhase, actionType: ProPlayerAction['type']): boolean {
  return VALID_PRO_ACTIONS[phase]?.includes(actionType) ?? false;
}

/**
 * Check if a phase transition is valid.
 */
export function isValidTransition(from: GamePhase, to: GamePhase): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}
