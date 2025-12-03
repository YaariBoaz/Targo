import { AchievementsComponent } from './../../components/achievements/achievements.component';
import { Type } from '@angular/core';
import { ChallengeListComponent } from 'src/app/components/challenges-list/challenges-list.component';
import { ChooseActivityComponent } from 'src/app/components/choose-activity/choose-activity.component';
import { DashboardComponent } from 'src/app/components/dashboard/dashboard.component';
import { LoginComponent } from 'src/app/components/login/login.component';
import { RankProgressComponent } from 'src/app/components/rank-progress/rank-progress.component';
import { RankingsComponent } from 'src/app/components/rankings/rankings.component';
import { RegisterComponent } from 'src/app/components/register/register.component';
import { SettingsComponent } from 'src/app/components/settings/settings.component';
import { ShootingComponent } from 'src/app/components/shooting/shooting.component';
import { StatisticsComponent } from 'src/app/components/statistics/statistics.component';
import { TargetSelectionComponent } from 'src/app/components/target-selection/target-selection.component';
import { TrainingSetupComponent } from 'src/app/components/training-setup/training-setup.component';
import { UserSettingsComponent } from 'src/app/components/user-settings/user-settings.component';
import { WelcomeComponent } from 'src/app/components/welcome/welcome.component';

export enum ScreenState {
  Dashboard = 'Dashboard',
  ChooseActivity = 'ChooseActivity',
  ChallegnesList = 'ChallegnesList',
  TrainingSetup = 'TrainingSetup',
  Ranking = 'Ranking',
  Statistics = 'Statistics',
  TargetSelection = 'TargetSelection',
  Shooting = 'Shooting',
  UserSettings = 'UserSettings',
  Achievements = 'Achievements',
  RankProgress = 'RankProgress',
  Settings = 'Settings',
  Register = 'Register',
  Welcome = 'Welcome',
  Login = 'Login',
}
export const ScreenComponentMap: Record<ScreenState, Type<any>> = {
  [ScreenState.Dashboard]: DashboardComponent,
  [ScreenState.ChooseActivity]: ChooseActivityComponent,
  [ScreenState.ChallegnesList]: ChallengeListComponent,
  [ScreenState.TrainingSetup]: TrainingSetupComponent,
  [ScreenState.Ranking]: RankingsComponent,
  [ScreenState.Statistics]: StatisticsComponent,
  [ScreenState.TargetSelection]: TargetSelectionComponent,
  [ScreenState.Shooting]: ShootingComponent,
  [ScreenState.UserSettings]: UserSettingsComponent,
  [ScreenState.Achievements]: AchievementsComponent,
  [ScreenState.RankProgress]: RankProgressComponent,
  [ScreenState.Settings]: SettingsComponent,
  [ScreenState.Register]: RegisterComponent,
  [ScreenState.Welcome]: WelcomeComponent,
  [ScreenState.Login]: LoginComponent, // Assuming Login uses the same component as Welcome
};

const screenOrder: ScreenState[] = [
  ScreenState.Dashboard,
  ScreenState.ChooseActivity,
  ScreenState.ChallegnesList,
  ScreenState.TrainingSetup,
  ScreenState.Ranking,
  ScreenState.Statistics,
  ScreenState.TargetSelection,
  ScreenState.Shooting,
  ScreenState.UserSettings,
  ScreenState.Register,
  ScreenState.Welcome,
  ScreenState.Login,
];
