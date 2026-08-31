import { UserSessionState, CreditPackage, PaymentMethod } from '../types';

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

  // Promote flow
  public startPromote(userId: number) {
    this.setStep(userId, 'promote_enter_url');
  }

  public setPromoteUrl(userId: number, url: string) {
    this.setStep(userId, 'promote_select_duration', {
      promoteUrl: url,
      promoteDurationSeconds: 15,
      promoteCostPerVisit: 1,
    });
  }

  public setPromoteDuration(userId: number, durationSeconds: number, costPerVisit: number) {
    const s = this.getSession(userId);
    s.promoteDurationSeconds = durationSeconds;
    s.promoteCostPerVisit = costPerVisit;
    s.step = 'promote_select_visits';
    this.sessions.set(userId, s);
  }

  public setPromoteVisits(userId: number, visits: number) {
    const s = this.getSession(userId);
    s.promoteVisits = visits;
    s.step = 'promote_confirm';
    this.sessions.set(userId, s);
  }

  // Payment flow
  public startPackagePayment(userId: number, pkg: CreditPackage) {
    this.setStep(userId, 'payment_select_method', { selectedPackage: pkg });
  }

  public setPaymentMethod(userId: number, method: PaymentMethod) {
    const s = this.getSession(userId);
    s.paymentMethod = method;
    s.step = 'payment_enter_trxid';
    this.sessions.set(userId, s);
  }

  // Support flow
  public startSupportMessage(userId: number) {
    this.setStep(userId, 'support_enter_message');
  }
}

export const sessionManager = new SessionManager();
