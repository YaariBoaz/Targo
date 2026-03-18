import { Injectable, inject } from '@angular/core';
import {
  Firestore as FirebaseFirestore,
  collection,
  getDocs,
  query,
  orderBy,
} from '@angular/fire/firestore';

export interface Location {
  id: string;
  name: string;
  displayOrder?: number;
}

@Injectable({
  providedIn: 'root',
})
export class LocationService {
  private firestore = inject(FirebaseFirestore);

  /**
   * Get all locations from Firestore
   * @returns Array of locations sorted by displayOrder
   */
  async getLocations(): Promise<Location[]> {
    try {
      const locationsRef = collection(this.firestore, 'locations');
      const q = query(locationsRef, orderBy('displayOrder', 'asc'));
      const snapshot = await getDocs(q);

      const locations: Location[] = [];
      snapshot.forEach((doc) => {
        locations.push({
          id: doc.id,
          ...doc.data(),
        } as Location);
      });

      console.log('Locations fetched from Firestore:', locations);
      return locations;
    } catch (error) {
      console.error('Error fetching locations:', error);
      // Return default location if fetch fails
      return [{ id: 'default', name: 'להב הרצליה', displayOrder: 1 }];
    }
  }
}
