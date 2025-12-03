import { Component } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonButton, IonIcon } from '@ionic/angular/standalone';
import { NavigationService } from '@core/services/navigation.service';
import { addIcons } from 'ionicons';
import { chevronBackOutline, eyeOutline, eyeOffOutline, cameraOutline } from 'ionicons/icons';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [IonButton, IonIcon, ReactiveFormsModule],
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
})
export class RegisterPage {
  registerForm: FormGroup;
  showPassword = false;
  profilePhoto: string | null = null;
  selectedLevel: 'recruit' | 'marksman' | 'pro' = 'recruit';

  constructor(
    private fb: FormBuilder,
    private navigationService: NavigationService
  ) {
    // Register icons
    addIcons({
      'chevron-back-outline': chevronBackOutline,
      'eye-outline': eyeOutline,
      'eye-off-outline': eyeOffOutline,
      'camera-outline': cameraOutline,
    });

    // Initialize form with validation
    this.registerForm = this.fb.group({
      nickname: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      location: [''], // Optional field
    });
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  async uploadPhoto() {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Prompt, // Let user choose between camera or gallery
      });

      if (image.dataUrl) {
        this.profilePhoto = image.dataUrl;
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      // If Camera plugin fails (web or no permissions), fallback to file input
      // You can add a file input fallback here if needed
    }
  }

  selectLevel(level: 'recruit' | 'marksman' | 'pro') {
    this.selectedLevel = level;
  }

  onRegister() {
    if (this.registerForm.valid) {
      const registrationData = {
        ...this.registerForm.value,
        shooterLevel: this.selectedLevel,
        profilePhoto: this.profilePhoto,
      };
      console.log('Register:', registrationData);
      // TODO: Implement Firebase authentication and user profile creation
      // For now, navigate to home
      this.navigationService.navigateRoot('/tabs/home');
    }
  }

  goBack() {
    this.navigationService.goBack('/auth/welcome');
  }
}
