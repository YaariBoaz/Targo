import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  getDocs,
  addDoc,
  query,
  limit,
  QuerySnapshot,
} from '@angular/fire/firestore';

export interface TrainingTip {
  id?: string;
  text: string;
  category?: 'general' | 'technique' | 'safety' | 'mental' | 'equipment';
}

@Injectable({
  providedIn: 'root',
})
export class TipsService {
  private firestore = inject(Firestore);
  private tipsCache: TrainingTip[] = [];

  constructor() {}

  /**
   * Get a random tip from Firestore or fallback to local tips
   */
  async getRandomTip(): Promise<TrainingTip> {
    try {
      // Try to load tips from Firestore
      await this.loadTips();

      // If Firestore has tips, use them
      if (this.tipsCache.length > 0) {
        const randomIndex = Math.floor(Math.random() * this.tipsCache.length);
        console.log(`TipsService - Selected tip ${randomIndex + 1} of ${this.tipsCache.length} from Firestore`);
        return this.tipsCache[randomIndex];
      }

      // Fallback to local tips if Firestore is empty
      console.warn('TipsService - No tips in Firestore, using local tips array');
      const localTips = this.getDefaultTips();
      const randomIndex = Math.floor(Math.random() * localTips.length);
      console.log(`TipsService - Selected tip ${randomIndex + 1} of ${localTips.length} from local array`);
      return localTips[randomIndex];
    } catch (error) {
      console.error('TipsService - Error fetching random tip:', error);
      // Use local tips as final fallback
      const localTips = this.getDefaultTips();
      const randomIndex = Math.floor(Math.random() * localTips.length);
      console.log(`TipsService - Error fallback, using tip ${randomIndex + 1} of ${localTips.length}`);
      return localTips[randomIndex];
    }
  }

  /**
   * Load all tips from Firestore into cache
   */
  private async loadTips(): Promise<void> {
    try {
      const tipsCollection = collection(this.firestore, 'trainingTips');
      const querySnapshot = await getDocs(tipsCollection);

      this.tipsCache = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as TrainingTip[];

      console.log(`Loaded ${this.tipsCache.length} tips from Firestore`);
    } catch (error) {
      console.error('Error loading tips:', error);
      this.tipsCache = [];
    }
  }

  /**
   * Initialize the tips collection with default tips
   * This should be called once to populate the database
   */
  async initializeTips(): Promise<void> {
    try {
      const tipsCollection = collection(this.firestore, 'trainingTips');

      // Check if tips already exist
      const existingTips = await getDocs(tipsCollection);
      if (existingTips.size > 0) {
        console.log('Tips already initialized');
        return;
      }

      // Add all tips
      const tips: TrainingTip[] = this.getDefaultTips();

      for (const tip of tips) {
        await addDoc(tipsCollection, tip);
      }

      console.log(`Successfully added ${tips.length} tips to Firestore`);

      // Refresh cache
      await this.loadTips();
    } catch (error) {
      console.error('Error initializing tips:', error);
    }
  }

  /**
   * Get the default set of 20 shooting training tips
   */
  private getDefaultTips(): TrainingTip[] {
    return [
      {
        text: 'Master your grip before anything else. A proper grip is the foundation of accurate shooting.',
        category: 'technique',
      },
      {
        text: 'Focus on your breathing. Exhale slowly and pause before pulling the trigger.',
        category: 'technique',
      },
      {
        text: 'Always practice proper trigger control. Squeeze smoothly, don\'t jerk the trigger.',
        category: 'technique',
      },
      {
        text: 'Keep both eyes open when shooting. It improves target acquisition and situational awareness.',
        category: 'technique',
      },
      {
        text: 'Dry fire practice at home can improve your shooting skills without spending on ammunition.',
        category: 'general',
      },
      {
        text: 'Choose fewer bullets for quick drills, or max out for endurance training!',
        category: 'general',
      },
      {
        text: 'Consistency is key. Practice with the same weapon regularly to build muscle memory.',
        category: 'general',
      },
      {
        text: 'Start slow and focus on accuracy. Speed will come naturally with practice.',
        category: 'technique',
      },
      {
        text: 'Always keep your weapon pointed in a safe direction, even during training.',
        category: 'safety',
      },
      {
        text: 'Wear proper ear and eye protection every single time you shoot.',
        category: 'safety',
      },
      {
        text: 'Never rely on your weapon\'s safety mechanism alone. Treat every gun as if it\'s loaded.',
        category: 'safety',
      },
      {
        text: 'Mental preparation is as important as physical training. Visualize success before each drill.',
        category: 'mental',
      },
      {
        text: 'Stay calm under pressure. Control your heart rate through breathing techniques.',
        category: 'mental',
      },
      {
        text: 'Don\'t be discouraged by bad sessions. Even professionals have off days.',
        category: 'mental',
      },
      {
        text: 'Clean your weapon regularly. A well-maintained firearm performs better and lasts longer.',
        category: 'equipment',
      },
      {
        text: 'Invest in quality ammunition. Cheap rounds can affect accuracy and reliability.',
        category: 'equipment',
      },
      {
        text: 'Find the right stance for you. Isosceles or Weaver - practice both and choose what works.',
        category: 'technique',
      },
      {
        text: 'Track your progress. Keep a shooting journal to identify patterns and improvements.',
        category: 'general',
      },
      {
        text: 'Practice shooting from different positions: standing, kneeling, prone, and behind cover.',
        category: 'technique',
      },
      {
        text: 'Study the fundamentals regularly. Even experts revisit the basics to maintain excellence.',
        category: 'general',
      },
    ];
  }

  /**
   * Add a new tip to Firestore
   */
  async addTip(tip: TrainingTip): Promise<void> {
    try {
      const tipsCollection = collection(this.firestore, 'trainingTips');
      await addDoc(tipsCollection, tip);

      // Refresh cache
      await this.loadTips();

      console.log('Tip added successfully');
    } catch (error) {
      console.error('Error adding tip:', error);
      throw error;
    }
  }
}
