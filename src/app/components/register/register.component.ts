import { Platform, ActionSheetController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { IonIcon, IonButton } from '@ionic/angular/standalone';
import { NavigationService } from 'src/app/shared/services/navigation.service';
import { ScreenComponentMap } from 'src/app/shared/models/screen-state';
import { AuthService } from 'src/app/shared/services/authentication/auth.service';
import { UserService } from 'src/app/shared/services/user.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  standalone: true,
  imports: [IonIcon, CommonModule, FormsModule, ReactiveFormsModule, IonIcon],
})
export class RegisterComponent {
  registerForm: FormGroup;
  levels = [
    { label: 'Recruit', value: 'Recruit', icon: 'walk-outline' },
    { label: 'Marksman', value: 'Marksman', icon: 'target-outline' },
    { label: 'Pro', value: 'Pro', icon: 'trophy-outline' },
  ];

  imgUrl = 'https://i.pravatar.cc/300';
  currentStep = 1;
  showPassword = false;
  previewImage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private actionSheetCtrl: ActionSheetController,
    private nav: NavigationService,
    private userService: UserService,
    private authService: AuthService
  ) {
    this.registerForm = this.fb.group({
      nickname: ['', Validators.required],
      password: ['', Validators.required],
      level: ['Recruit'],
      email: [''],
      location: [''],
      profileImage: [''],
    });
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  selectLevel(level: string) {
    this.registerForm.patchValue({ level });
  }

  step1Valid() {
    return (
      this.registerForm.get('nickname')?.valid &&
      this.registerForm.get('password')?.valid
    );
  }

  nextStep() {
    if (this.step1Valid()) {
      this.currentStep = 2;
    }
  }

  prevStep() {
    this.currentStep = 1;
  }

  async selectImageSource() {
    const actionSheet = await this.actionSheetCtrl.create({
      header: 'Upload Profile Photo',
      buttons: [
        {
          text: 'Take Photo',
          icon: 'camera',
          handler: () => this.getImage(CameraSource.Camera),
        },
        {
          text: 'Choose from Gallery',
          icon: 'image',
          handler: () => this.getImage(CameraSource.Photos),
        },
        {
          text: 'Cancel',
          icon: 'close',
          role: 'cancel',
        },
      ],
    });

    await actionSheet.present();
  }

  async getImage(source: CameraSource) {
    try {
      const image = await Camera.getPhoto({
        quality: 80,
        resultType: CameraResultType.DataUrl,
        source,
      });

      if (image.dataUrl) {
        this.previewImage = image.dataUrl;
        this.registerForm.patchValue({ profileImage: image.dataUrl });
      } else if (image.webPath) {
        this.previewImage = image.webPath;
        this.registerForm.patchValue({ profileImage: image.webPath });
      }
    } catch (err) {
      console.error('Camera error:', err);
    }
  }

  async register() {
    try {
      const cred = await this.authService.registerWithEmailAndPassword(
        this.registerForm.value.email,
        this.registerForm.value.password
      );

      await this.userService.createUser(cred.user.uid, {
        email: this.registerForm.value.email,
        nickname: this.registerForm.value.nickname,
        shooterLevel: this.registerForm.value.level,
        imgUrl: this.imgUrl,
      });
      console.log('Registered user:', cred);
      this.nav.reset(ScreenComponentMap.Dashboard);
    } catch (err) {
      console.error('Register error:', err);
    }
  }
}
