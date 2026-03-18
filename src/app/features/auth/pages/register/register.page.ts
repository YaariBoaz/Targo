import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonButton, IonIcon, IonSelect, IonSelectOption, ToastController, LoadingController } from '@ionic/angular/standalone';
import { NavigationService } from '@core/services/navigation.service';
import { AuthService } from '@core/services/auth';
import { StorageService } from '@core/services/storage.service';
import { FirestoreService } from '@core/services/firestore';
import { LocationService, Location } from '@core/services/location.service';
import { OnboardingService } from '@core/services/onboarding.service';
import { updateProfile } from '@angular/fire/auth';
import { addIcons } from 'ionicons';
import { chevronBackOutline, eyeOutline, eyeOffOutline, cameraOutline } from 'ionicons/icons';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [IonButton, IonIcon, IonSelect, IonSelectOption, ReactiveFormsModule],
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
})
export class RegisterPage {
  registerForm: FormGroup;
  showPassword = false;
  profilePhoto: string | null = null; // This stores the temporary dataUrl for display
  profilePhotoDataUrl: string | null = null; // This stores the dataUrl for upload
  selectedLevel: 'recruit' | 'marksman' | 'pro' = 'recruit';
  locations: Location[] = [];
  loadingLocations = true;

  private fb = inject(FormBuilder);
  private navigationService = inject(NavigationService);
  private authService = inject(AuthService);
  private storageService = inject(StorageService);
  private firestoreService = inject(FirestoreService);
  private locationService = inject(LocationService);
  private onboardingService = inject(OnboardingService);
  private toastController = inject(ToastController);
  private loadingController = inject(LoadingController);

  constructor() {
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

    // Load locations from Firestore
    this.loadLocations();
  }

  async loadLocations() {
    try {
      this.loadingLocations = true;
      this.locations = await this.locationService.getLocations();
      console.log('Locations loaded:', this.locations);
    } catch (error) {
      console.error('Error loading locations:', error);
      // Show error toast but don't block registration
      await this.showError('Failed to load locations. You can still register without selecting a location.');
    } finally {
      this.loadingLocations = false;
    }
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
        // Store dataUrl for both display and later upload
        this.profilePhoto = image.dataUrl;
        this.profilePhotoDataUrl = image.dataUrl;
        console.log('Photo captured successfully');
      }
    } catch (error) {
      console.error('Error capturing photo:', error);
      await this.showError('Failed to capture photo. Please try again.');
    }
  }

  selectLevel(level: 'recruit' | 'marksman' | 'pro') {
    this.selectedLevel = level;
  }

  async onRegister() {
    if (this.registerForm.valid) {
      const loading = await this.loadingController.create({
        message: 'Creating your account...',
      });
      await loading.present();

      try {
        const formValue = this.registerForm.value;
        const { email, password, nickname, location } = formValue;

        // Step 1: Register user with email and password first
        loading.message = 'Creating your account...';
        const user = await this.authService.registerWithEmail(email, password);

        // Step 2: Upload profile photo if available
        let photoURL: string | undefined = undefined;
        if (this.profilePhotoDataUrl) {
          try {
            loading.message = 'Uploading profile photo...';
            const photoPath = this.storageService.generateProfilePhotoPath(user.uid);
            photoURL = await this.storageService.uploadBase64Image(photoPath, this.profilePhotoDataUrl);
            console.log('Profile photo uploaded:', photoURL);
          } catch (photoError) {
            console.error('Failed to upload photo:', photoError);
            // Continue without photo - don't fail registration
          }
        }

        // Step 3: Update user profile with additional data
        loading.message = 'Saving profile...';
        const profileData = {
          nickname,
          location: location || undefined,
          shooterLevel: this.selectedLevel,
          photoURL,
        };

        // Update Firebase Auth profile with displayName and photoURL
        if (profileData.nickname || photoURL) {
          await updateProfile(user, {
            displayName: profileData.nickname || null,
            photoURL: photoURL || null,
          });
        }

        // Update Firestore with full profile data
        await this.firestoreService.updateUserProfile(user.uid, profileData);

        await loading.dismiss();

        // Show success message
        await this.showSuccess('Account created successfully!');

        // Navigate to onboarding for new users
        this.navigationService.navigateRoot('/onboarding');
      } catch (error: any) {
        await loading.dismiss();
        await this.showError(error.message || 'Registration failed. Please try again.');
      }
    } else {
      // Show validation error
      await this.showError('Please fill in all required fields correctly.');
    }
  }

  private async showSuccess(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
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
    this.navigationService.goBack('/auth/welcome');
  }
}
