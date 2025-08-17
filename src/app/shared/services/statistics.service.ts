import { Injectable } from '@angular/core';
import { Observable, from, map, combineLatest } from 'rxjs';
import { ShootingSessionService } from './shooting-session.service';
import { ShootingSession } from '../models/shot-stat';

export interface OverviewStats {
  accuracy: number; // Average distance from center (cm)
  avgSplit: string; // Average split time formatted as "0:08"
  avgGrouping: number; // Grouping metric
  hitRatio: number; // Hit ratio percentage
  challengesComplete: number; // Percentage of challenges completed
  globalRank: number; // User's global ranking
  weeklyActivity: { day: string; value: number; date: Date }[];
}

export interface WeeklyActivityData {
  day: string;
  value: number;
  date: Date;
}

@Injectable({
  providedIn: 'root'
})
export class StatisticsService {

  constructor(private shootingSessionService: ShootingSessionService) {}

  /**
   * Gets comprehensive overview statistics for a user
   */
  getOverviewStats(userId: string): Observable<OverviewStats> {
    return combineLatest([
      this.shootingSessionService.getUserSessions(userId, 1000),
      this.getWeeklyActivity(userId)
    ]).pipe(
      map(([sessions, weeklyActivity]) => {
        const completedSessions = sessions.filter(s => s.endTime && s.hitPoints?.length > 0);
        
        return {
          accuracy: this.calculateAverageAccuracy(completedSessions),
          avgSplit: this.formatSplitTime(this.calculateAverageSplitTime(completedSessions)),
          avgGrouping: this.calculateAverageGrouping(completedSessions),
          hitRatio: this.calculateHitRatio(completedSessions),
          challengesComplete: this.calculateChallengesComplete(sessions),
          globalRank: this.calculateGlobalRank(userId, completedSessions),
          weeklyActivity
        };
      })
    );
  }

  /**
   * Calculates average distance from center (accuracy) in cm
   */
  private calculateAverageAccuracy(sessions: ShootingSession[]): number {
    if (!sessions.length) return 0;
    
    let totalDistance = 0;
    let totalHits = 0;
    
    sessions.forEach(session => {
      if (session.hitPoints) {
        session.hitPoints.forEach(hit => {
          // Convert from 0-100 scale to cm (assuming 50cm target radius)
          const distanceInCm = (hit.distanceFromCenter / 100) * 50;
          totalDistance += distanceInCm;
          totalHits++;
        });
      }
    });
    
    return totalHits > 0 ? +(totalDistance / totalHits).toFixed(2) : 0;
  }

  /**
   * Calculates average split time across all sessions
   */
  private calculateAverageSplitTime(sessions: ShootingSession[]): number {
    if (!sessions.length) return 0;
    
    let totalSplitTime = 0;
    let splitCount = 0;
    
    sessions.forEach(session => {
      if (session.shotStats) {
        // Skip first shot (no split time)
        session.shotStats.slice(1).forEach(shot => {
          totalSplitTime += shot.splitTime;
          splitCount++;
        });
      }
    });
    
    return splitCount > 0 ? totalSplitTime / splitCount : 0;
  }

  /**
   * Formats split time from seconds to "M:SS" format
   */
  private formatSplitTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  /**
   * Calculates average grouping (spread of shots)
   */
  private calculateAverageGrouping(sessions: ShootingSession[]): number {
    if (!sessions.length) return 0;
    
    let totalGrouping = 0;
    let sessionCount = 0;
    
    sessions.forEach(session => {
      if (session.hitPoints && session.hitPoints.length > 1) {
        const grouping = this.calculateSessionGrouping(session.hitPoints);
        totalGrouping += grouping;
        sessionCount++;
      }
    });
    
    return sessionCount > 0 ? +(totalGrouping / sessionCount).toFixed(2) : 0;
  }

  /**
   * Calculates grouping for a single session (standard deviation of distances)
   */
  private calculateSessionGrouping(hitPoints: any[]): number {
    if (hitPoints.length <= 1) return 0;
    
    // Calculate mean distance
    const meanDistance = hitPoints.reduce((sum, hit) => sum + hit.distanceFromCenter, 0) / hitPoints.length;
    
    // Calculate standard deviation
    const variance = hitPoints.reduce((sum, hit) => {
      const diff = hit.distanceFromCenter - meanDistance;
      return sum + (diff * diff);
    }, 0) / hitPoints.length;
    
    return Math.sqrt(variance);
  }

  /**
   * Calculates hit ratio percentage
   */
  private calculateHitRatio(sessions: ShootingSession[]): number {
    if (!sessions.length) return 0;
    
    let totalHits = 0;
    let totalShots = 0;
    
    sessions.forEach(session => {
      if (session.hitPoints && session.totalShots) {
        // Assuming hits within certain radius count as "hits"
        const hits = session.hitPoints.filter(hit => hit.distanceFromCenter <= 50).length;
        totalHits += hits;
        totalShots += session.totalShots;
      }
    });
    
    return totalShots > 0 ? Math.round((totalHits / totalShots) * 100) : 0;
  }

  /**
   * Calculates percentage of challenges completed
   */
  private calculateChallengesComplete(sessions: ShootingSession[]): number {
    const challengeSessions = sessions.filter(s => s.mode === 'challenge');
    const completedChallenges = challengeSessions.filter(s => s.endTime).length;
    
    // Assuming there are predefined challenges - you can adjust this logic
    const totalChallenges = Math.max(challengeSessions.length, 10); // Minimum of 10 challenges
    
    return Math.round((completedChallenges / totalChallenges) * 100);
  }

  /**
   * Calculates global rank (placeholder - would need real ranking system)
   */
  private calculateGlobalRank(userId: string, sessions: ShootingSession[]): number {
    // This is a placeholder calculation
    // In a real app, you'd query all users' stats and rank them
    const userScore = this.calculateUserScore(sessions);
    
    // Simulate rank based on score (higher score = better rank)
    const simulatedRank = Math.max(1, 5000 - Math.floor(userScore * 10));
    return simulatedRank;
  }

  /**
   * Calculates a user's overall score for ranking
   */
  private calculateUserScore(sessions: ShootingSession[]): number {
    if (!sessions.length) return 0;
    
    let totalScore = 0;
    sessions.forEach(session => {
      if (session.results) {
        // Weight different metrics
        const accuracyScore = session.results.hitRate * 2;
        const speedScore = session.results.bestSplitTime > 0 ? (10 / session.results.bestSplitTime) * 50 : 0;
        const consistencyScore = (100 - session.results.avgDistance) * 1.5;
        
        totalScore += accuracyScore + speedScore + consistencyScore;
      }
    });
    
    return sessions.length > 0 ? totalScore / sessions.length : 0;
  }

  /**
   * Gets weekly activity data for the current week
   */
  private getWeeklyActivity(userId: string): Observable<WeeklyActivityData[]> {
    return this.shootingSessionService.getUserSessions(userId, 500).pipe(
      map(sessions => {
        const weekDays = ['SU', 'M', 'T', 'W', 'TH', 'F', 'SA'];
        const today = new Date();
        const currentWeekStart = new Date(today.setDate(today.getDate() - today.getDay()));
        
        const weeklyData: WeeklyActivityData[] = weekDays.map((day, index) => {
          const date = new Date(currentWeekStart);
          date.setDate(currentWeekStart.getDate() + index);
          
          // Count sessions for this day
          const dayStart = new Date(date);
          dayStart.setHours(0, 0, 0, 0);
          const dayEnd = new Date(date);
          dayEnd.setHours(23, 59, 59, 999);
          
          const sessionsThisDay = sessions.filter(session => {
            const sessionDate = new Date(session.createdAt);
            return sessionDate >= dayStart && sessionDate <= dayEnd;
          }).length;
          
          return {
            day: day,
            value: sessionsThisDay,
            date: new Date(date)
          };
        });
        
        return weeklyData;
      })
    );
  }

  /**
   * Gets recent activity trend (for charts)
   */
  getActivityTrend(userId: string, days: number = 30): Observable<{date: Date, sessions: number}[]> {
    return this.shootingSessionService.getUserSessions(userId, 1000).pipe(
      map(sessions => {
        const trend: {date: Date, sessions: number}[] = [];
        const today = new Date();
        
        for (let i = days - 1; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(today.getDate() - i);
          date.setHours(0, 0, 0, 0);
          
          const dayEnd = new Date(date);
          dayEnd.setHours(23, 59, 59, 999);
          
          const sessionsThisDay = sessions.filter(session => {
            const sessionDate = new Date(session.createdAt);
            return sessionDate >= date && sessionDate <= dayEnd;
          }).length;
          
          trend.push({
            date: new Date(date),
            sessions: sessionsThisDay
          });
        }
        
        return trend;
      })
    );
  }

  /**
   * Gets performance insights and recommendations
   */
  getPerformanceInsights(userId: string): Observable<{
    insights: string[];
    recommendations: { id: string; name: string; description: string }[];
  }> {
    return this.shootingSessionService.getUserSessions(userId, 100).pipe(
      map(sessions => {
        const completedSessions = sessions.filter(s => s.endTime && s.results);
        const insights: string[] = [];
        const recommendations: { id: string; name: string; description: string }[] = [];
        
        if (completedSessions.length > 0) {
          const avgAccuracy = completedSessions.reduce((sum, s) => sum + (s.results?.hitRate || 0), 0) / completedSessions.length;
          const avgSplit = completedSessions.reduce((sum, s) => sum + (s.results?.bestSplitTime || 0), 0) / completedSessions.length;
          
          // Generate insights
          if (avgAccuracy < 60) {
            insights.push("Your accuracy has room for improvement");
            recommendations.push({
              id: 'accuracy-drill',
              name: 'Precision Practice',
              description: 'Focus on slow, deliberate shots to improve accuracy'
            });
          }
          
          if (avgSplit > 3) {
            insights.push("Work on your split times for better performance");
            recommendations.push({
              id: 'speed-drill',
              name: 'Speed Drills',
              description: 'Practice quick target acquisition and shooting'
            });
          }
          
          // Default recommendation
          if (recommendations.length === 0) {
            recommendations.push({
              id: 'grip-master-20',
              name: 'Grip Master ×20',
              description: 'Improve your grouping with grip strengthening exercises'
            });
          }
        }
        
        return { insights, recommendations };
      })
    );
  }
}