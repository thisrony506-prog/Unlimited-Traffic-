import { UserSessionState, WithdrawalMethod } from '../types';

class SessionManager {
  private sessions: Map<number, UserSessionState> = new Map();

  public getSession(userId: number): UserSessionState {
    let session = this.sessions.get(userId);
    if (!session) {
      session = { step: 'idle' };
      this.sessions.set(userId, session);
    }
    return session;
  }

  public setStep(userId: number, step: UserSessionState['step'], data?: Partial<UserSessionState>) {
    const session = this.getSession(userId);
    session.step = step;
    if (data) {
      Object.assign(session, data);
    }
    this.sessions.set(userId, session);
  }

  public clearSession(userId: number) {
    this.sessions.set(userId, { step: 'idle' });
  }

  public startTaskProof(userId: number, taskId: string) {
    this.setStep(userId, 'submitting_task_proof', { activeTaskId: taskId });
  }

  public startWithdrawMethod(userId: number, method: WithdrawalMethod) {
    this.setStep(userId, 'withdraw_enter_amount', { withdrawMethod: method });
  }

  public setWithdrawAmount(userId: number, amount: number) {
    const s = this.getSession(userId);
    s.withdrawAmount = amount;
    s.step = 'withdraw_enter_account';
    this.sessions.set(userId, s);
  }

  public setWithdrawAccount(userId: number, account: string) {
    const s = this.getSession(userId);
    s.withdrawAccount = account;
    s.step = 'withdraw_confirm';
    this.sessions.set(userId, s);
  }

  public startSupportMessage(userId: number) {
    this.setStep(userId, 'entering_support_message');
  }
}

export const sessionManager = new SessionManager();
