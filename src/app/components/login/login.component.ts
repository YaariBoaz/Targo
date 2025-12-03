import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ScreenComponentMap } from 'src/app/shared/models/screen-state';
import { User } from 'src/app/shared/models/shot-stat';
import { AuthService } from 'src/app/shared/services/authentication/auth.service';
import { UserStoreService } from 'src/app/shared/services/authentication/user-store.service';
import { NavigationService } from 'src/app/shared/services/navigation.service';
import { UserService } from 'src/app/shared/services/user.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, CommonModule],
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  showPassword = false;
  wrongPassword = false;
  constructor(
    private fb: FormBuilder,
    private nav: NavigationService,
    private authService: AuthService,
    private userService: UserService,
    private userStore: UserStoreService
  ) {
    this.loginForm = this.fb.group({
      email: ['', Validators.required],
      password: ['', Validators.required],
    });
  }
  ngOnInit(): void {}

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  onForgotPassword() {
    // You can navigate or open a modal
    alert('Password recovery coming soon.');
  }

  navigateToRegister() {
    this.nav.push(ScreenComponentMap.Register);
  }

  continueAsGuest() {
    console.log('Continuing as guest...');
  }

  async loginWithEmailAndPassword() {
    try {
      const cred = await this.authService.loginWithEmailAndPassword(
        this.loginForm.value.email,
        this.loginForm.value.password
      );
      const uid = cred.user.uid;

      const userSnap = await this.userService.getUser(uid);
      if (!userSnap.exists())
        throw new Error('User profile not found in Firestore');

      const userData = userSnap.data();
      this.userStore.user = userData; // Save to UserStoreService
      // Save locally

      console.log('User logged in & profile loaded:', userData);

      // Navigate to app dashboard
      this.nav.reset(ScreenComponentMap.Dashboard);
    } catch (err) {
      console.error('Login error:', err);
    }
  }
}
