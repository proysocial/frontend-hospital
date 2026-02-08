import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class RecoverFlowService {

  private emailVerified = false;
  private codeVerified = false;

  setEmailVerified() {
    this.emailVerified = true;
  }

  setCodeVerified() {
    this.codeVerified = true;
  }

  canAccessCode(): boolean {
    return this.emailVerified;
  }

  canAccessReset(): boolean {
    return this.emailVerified && this.codeVerified;
  }

  reset() {
    this.emailVerified = false;
    this.codeVerified = false;
  }
}
