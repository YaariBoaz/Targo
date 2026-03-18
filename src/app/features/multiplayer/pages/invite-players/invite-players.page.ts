import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FirebaseService } from '@shared/services/firebase.service';
import { addIcons } from 'ionicons';
import { arrowBack, pencil, checkmark } from 'ionicons/icons';
import { FriendService } from '@shared/services/friend.service';
import { User } from '@models/user.model';

interface FriendWithStatus extends User {
  selected: boolean;
  isOnline: boolean;
  rank?: number;
  score?: number;
}

@Component({
  selector: 'app-invite-players',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './invite-players.page.html',
  styleUrls: ['./invite-players.page.scss'],
})
export class InvitePlayersPage implements OnInit {
  private router = inject(Router);
  private firebase = inject(FirebaseService);
  private friendService = inject(FriendService);

  searchQuery = '';
  selectedFriends: FriendWithStatus[] = [];
  friends: FriendWithStatus[] = [];
  isLoading = true;

  constructor() {
    addIcons({ arrowBack, pencil, checkmark });
  }

  ngOnInit() {
    this.loadFriends();
  }

  private async loadFriends() {
    const userId = this.firebase.auth.currentUser?.uid;
    if (!userId) {
      this.router.navigate(['/auth/login']);
      return;
    }

    try {
      const friends = await this.friendService.getFriends(userId);
      this.friends = friends.map((friend) => ({
        ...friend,
        selected: false,
        isOnline: false,
        rank: undefined,
        score: undefined,
      }));
      this.isLoading = false;
    } catch (error) {
      console.error('Error loading friends:', error);
      this.isLoading = false;
    }
  }

  goBack() {
    this.router.navigate(['/tabs/home']);
  }

  goToAddFriends() {
    this.router.navigate(['/friends/add']);
  }

  removeFriend(friend: FriendWithStatus) {
    friend.selected = false;
    const index = this.selectedFriends.findIndex((f) => f.uid === friend.uid);
    if (index > -1) {
      this.selectedFriends.splice(index, 1);
    }
  }

  toggleFriend(friend: FriendWithStatus) {
    friend.selected = !friend.selected;

    if (friend.selected) {
      this.selectedFriends.push(friend);
    } else {
      this.removeFriend(friend);
    }
  }

  sendInvitations() {
    if (this.selectedFriends.length === 0) {
      alert('Please select at least one friend to invite');
      return;
    }

    // TODO: Implement actual invitation sending via Firestore/FCM
    console.log('Sending invitations to:', this.selectedFriends);

    // For now, navigate to multiplayer lobby
    // In production, you'd send invites and wait for responses
    this.router.navigate(['/multiplayer-lobby']);
  }

  getInitials(name?: string): string {
    if (!name) return '??';
    const words = name.split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  get filteredFriends(): FriendWithStatus[] {
    if (!this.searchQuery) {
      return this.friends;
    }

    const query = this.searchQuery.toLowerCase();
    return this.friends.filter((friend) =>
      friend.displayName?.toLowerCase().includes(query)
    );
  }

  get selectedCount(): number {
    return this.selectedFriends.length;
  }
}
