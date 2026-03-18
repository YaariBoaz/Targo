import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { Subscription, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { FriendService } from '@core/services/friend.service';
import { PresenceService } from '@core/services/presence.service';
import { User } from '@models/user.model';
import { PresenceStatus } from '@models/presence.model';

interface FriendWithPresence extends User {
  isOnline: boolean;
  lastSeen?: Date;
}

@Component({
  selector: 'app-friends-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './friends-list.page.html',
  styleUrls: ['./friends-list.page.scss'],
})
export class FriendsListPage implements OnInit, OnDestroy {
  private router = inject(Router);
  private auth = inject(Auth);
  private friendService = inject(FriendService);
  private presenceService = inject(PresenceService);

  friends: FriendWithPresence[] = [];
  isLoading = true;
  private friendsSubscription?: Subscription;

  ngOnInit() {
    this.loadFriends();
  }

  ngOnDestroy() {
    this.friendsSubscription?.unsubscribe();
  }

  private loadFriends() {
    const userId = this.auth.currentUser?.uid;
    if (!userId) {
      this.router.navigate(['/login']);
      return;
    }

    this.friendsSubscription = this.friendService
      .getFriends(userId)
      .pipe(
        map((friends) => {
          // For each friend, get their presence status
          return friends.map((friend) => {
            const friendWithPresence: FriendWithPresence = {
              ...friend,
              isOnline: false,
            };

            // Subscribe to presence
            this.presenceService
              .getUserPresence(friend.uid)
              .subscribe((presence: PresenceStatus) => {
                friendWithPresence.isOnline = presence.online;
                friendWithPresence.lastSeen = new Date(presence.lastSeen);
              });

            return friendWithPresence;
          });
        })
      )
      .subscribe({
        next: (friends) => {
          this.friends = friends;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading friends:', error);
          this.isLoading = false;
        },
      });
  }

  goToAddFriends() {
    this.router.navigate(['/friends/add']);
  }

  goToFriendRequests() {
    this.router.navigate(['/friends/requests']);
  }

  inviteFriend(friend: FriendWithPresence) {
    // TODO: Implement multiplayer invite
    console.log('Invite friend:', friend);
    // Navigate to multiplayer with friend pre-selected
    this.router.navigate(['/multiplayer/invite-players'], {
      queryParams: { preselected: friend.uid },
    });
  }

  async removeFriend(friend: FriendWithPresence) {
    const confirmed = confirm(`Remove ${friend.displayName} from your friends?`);
    if (!confirmed) return;

    try {
      const currentUserId = this.auth.currentUser?.uid;
      if (!currentUserId) return;

      const friendshipId = this.friendService.getFriendshipId(
        currentUserId,
        friend.uid
      );
      await this.friendService.removeFriend(friendshipId);
    } catch (error) {
      console.error('Error removing friend:', error);
      alert('Failed to remove friend');
    }
  }

  getInitials(name?: string): string {
    if (!name) return '??';
    const words = name.split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  goBack() {
    this.router.navigate(['/tabs/home']);
  }
}
