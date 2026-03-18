import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonContent, IonButton, IonIcon } from '@ionic/angular/standalone';
import { NavigationService } from '@core/services/navigation.service';
import { OnboardingService } from '@core/services/onboarding.service';
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

  private onboardingService = inject(OnboardingService);

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

  async onLogin() {
    if (this.loginForm.valid) {
      console.log('Login:', this.loginForm.value);
      // TODO: Implement Firebase authentication
      // For now, navigate to home after checking onboarding
      await this.checkOnboardingAndRedirect();
    }
  }

  private async checkOnboardingAndRedirect() {
    const hasSeenOnboarding = await this.onboardingService.hasSeenOnboarding();
    if (hasSeenOnboarding) {
      this.navigationService.navigateRoot('/tabs/home');
    } else {
      this.navigationService.navigateRoot('/onboarding');
    }
  }

  goBack() {
    this.navigationService.goBack('/auth/welcome');
  }

  forgotPassword() {
    this.navigationService.navigateForward('/auth/forgot-password');
  }

  goToRegister() {
    this.navigationService.navigateForward('/auth/register');
  }

  async continueAsGuest() {
    await this.checkOnboardingAndRedirect();
  }
}
