import { Component, inject } from '@angular/core';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import {
  IonButton,
  IonIcon,
  ToastController,
  LoadingController,
  IonContent,
} from '@ionic/angular/standalone';
import { NavigationService } from '@core/services/navigation.service';
import { AuthService } from '@core/services/auth';
import { addIcons } from 'ionicons';
import { chevronBackOutline } from 'ionicons/icons';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [IonContent, IonButton, IonIcon, ReactiveFormsModule],
  templateUrl: './forgot-password.page.html',
  styleUrls: ['./forgot-password.page.scss'],
})
export class ForgotPasswordPage {
  forgotPasswordForm: FormGroup;

  private fb = inject(FormBuilder);
  private navigationService = inject(NavigationService);
  private authService = inject(AuthService);
  private toastController = inject(ToastController);
  private loadingController = inject(LoadingController);

  constructor() {
    // Register icons
    addIcons({
      'chevron-back-outline': chevronBackOutline,
    });

    // Initialize form with validation
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  async onResetPassword() {
    if (this.forgotPasswordForm.valid) {
      const loading = await this.loadingController.create({
        message: 'Sending reset email...',
      });
      await loading.present();

      try {
        const email = this.forgotPasswordForm.value.email;
        console.log('Attempting to send password reset email to:', email);

        await this.authService.resetPassword(email);

        await loading.dismiss();

        // Show success message with spam warning
        await this.showSuccess(
          'Password reset email sent! ⚠️ Please check your SPAM/JUNK folder if you don\'t see it in your inbox.'
        );

        console.log('Password reset email sent successfully to:', email);

        // Navigate back to login after showing success message
        setTimeout(() => {
          this.navigationService.goBack('/auth/login');
        }, 2000);
      } catch (error: any) {
        await loading.dismiss();
        console.error('Password reset error details:', error);

        // Provide more specific error messages
        let errorMessage = 'Failed to send reset email. Please try again.';

        if (error.message?.includes('user-not-found')) {
          errorMessage = 'No account found with this email address.';
        } else if (error.message?.includes('invalid-email')) {
          errorMessage = 'Invalid email address format.';
        } else if (error.message?.includes('too-many-requests')) {
          errorMessage = 'Too many attempts. Please try again later.';
        } else if (error.message) {
          errorMessage = error.message;
        }

        await this.showError(errorMessage);
      }
    } else {
      await this.showError('Please enter a valid email address.');
    }
  }

  private async showSuccess(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 5000, // Increased to 5 seconds for longer message
      position: 'top',
      color: 'success',
    });
    await toast.present();
  }

  private async showError(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'top',
      color: 'danger',
    });
    await toast.present();
  }

  goBack() {
    this.navigationService.goBack('/auth/login');
  }
}
