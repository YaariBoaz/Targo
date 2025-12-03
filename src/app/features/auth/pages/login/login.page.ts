import { Component } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonContent, IonButton, IonIcon } from '@ionic/angular/standalone';
import { NavigationService } from '@core/services/navigation.service';
import { addIcons } from 'ionicons';
import { chevronBackOutline, eyeOutline, eyeOffOutline } from 'ionicons/icons';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [IonContent, IonButton, IonIcon, ReactiveFormsModule],
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage {
  loginForm: FormGroup;
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private navigationService: NavigationService
  ) {
    // Register icons
    addIcons({
      'chevron-back-outline': chevronBackOutline,
      'eye-outline': eyeOutline,
      'eye-off-outline': eyeOffOutline,
    });

    // Initialize form with validation
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  onLogin() {
    if (this.loginForm.valid) {
      console.log('Login:', this.loginForm.value);
      // TODO: Implement Firebase authentication
      // For now, navigate to home
      this.navigationService.navigateRoot('/tabs/home');
    }
  }

  goBack() {
    this.navigationService.goBack('/auth/welcome');
  }

  forgotPassword() {
    console.log('Forgot password clicked');
    // TODO: Navigate to forgot password page
  }

  goToRegister() {
    this.navigationService.navigateForward('/auth/register');
  }

  continueAsGuest() {
    this.navigationService.navigateRoot('/tabs/home');
  }
}
