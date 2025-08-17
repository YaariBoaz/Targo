// src/app/services/user-store.service.ts
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class UserStoreService {
  private _user: any = null;

  get user() {
    if (!this._user) {
      const saved = localStorage.getItem('user');
      if (saved) this._user = JSON.parse(saved);
    }
    return this._user;
  }

  set user(data: any) {
    this._user = data;
    localStorage.setItem('user', JSON.stringify(data));
  }

  clear() {
    this._user = null;
    localStorage.removeItem('user');
  }
}
