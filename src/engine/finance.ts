import type { GameState } from './types';
import { LOAN_SHARK_INTEREST_RATE } from './constants';

/**
 * Accrue daily loan shark interest on outstanding debt.
 * Called automatically when traveling (day advances).
 */
export function accrueInterest(state: GameState): GameState {
  if (state.debt <= 0) return state;
  const interest = Math.floor(state.debt * LOAN_SHARK_INTEREST_RATE);
  return { ...state, debt: state.debt + interest };
}

/**
 * Deposit cash into the bank.
 */
export function deposit(state: GameState, amount: number): GameState {
  if (amount <= 0) {
    throw new Error('Deposit amount must be positive');
  }
  if (amount > state.cash) {
    throw new Error(`Cannot deposit $${amount}. Available cash: $${state.cash}`);
  }
  return {
    ...state,
    cash: state.cash - amount,
    bank: state.bank + amount,
  };
}

/**
 * Withdraw cash from the bank.
 */
export function withdraw(state: GameState, amount: number): GameState {
  if (amount <= 0) {
    throw new Error('Withdrawal amount must be positive');
  }
  if (amount > state.bank) {
    throw new Error(`Cannot withdraw $${amount}. Bank balance: $${state.bank}`);
  }
  return {
    ...state,
    cash: state.cash + amount,
    bank: state.bank - amount,
  };
}

/**
 * Pay back part or all of the loan shark debt.
 */
export function payDebt(state: GameState, amount: number): GameState {
  if (amount <= 0) {
    throw new Error('Payment amount must be positive');
  }
  if (amount > state.cash) {
    throw new Error(`Cannot pay $${amount}. Available cash: $${state.cash}`);
  }
  // Don't overpay
  const payment = Math.min(amount, state.debt);
  return {
    ...state,
    cash: state.cash - payment,
    debt: state.debt - payment,
  };
}
