import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { Subscription, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { FriendService } from '@core/services/friend.service';
import { UserService } from '@core/services/user.service';
import { Friendship } from '@models/friendship.model';
import { User } from '@models/user.model';

interface FriendRequestWithUser extends Friendship {
  user: User;
}

@Component({
  selector: 'app-friend-requests',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './friend-requests.page.html',
  styleUrls: ['./friend-requests.page.scss'],
})
export class FriendRequestsPage implements OnInit, OnDestroy {
  private router = inject(Router);
  private auth = inject(Auth);
  private friendService = inject(FriendService);
  private userService = inject(UserService);

  activeTab: 'received' | 'sent' = 'received';
  receivedRequests: FriendRequestWithUser[] = [];
  sentRequests: FriendRequestWithUser[] = [];
  isLoading = true;

  private requestsSubscription?: Subscription;

  ngOnInit() {
    this.loadRequests();
  }

  ngOnDestroy() {
    this.requestsSubscription?.unsubscribe();
  }

  private loadRequests() {
    const userId = this.auth.currentUser?.uid;
    if (!userId) {
      this.router.navigate(['/login']);
      return;
    }

    this.requestsSubscription = combineLatest([
      this.friendService.getPendingRequestsReceived(userId),
      this.friendService.getPendingRequestsSent(userId),
    ]).subscribe({
      next: async ([received, sent]) => {
        // Load user details for received requests
        this.receivedRequests = await Promise.all(
          received.map(async (request) => {
            // Get the other user's ID (the one who sent the request)
            const otherUserId = request.initiatedBy;
            const user = await this.userService
              .getUserProfile(otherUserId)
              .toPromise();

            return {
              ...request,
              user: user!,
            };
          })
        );

        // Load user details for sent requests
        this.sentRequests = await Promise.all(
          sent.map(async (request) => {
            // Get the other user's ID (the one who received the request)
            const otherUserId =
              request.user1 === userId ? request.user2 : request.user1;
            const user = await this.userService
              .getUserProfile(otherUserId)
              .toPromise();

            return {
              ...request,
              user: user!,
            };
          })
        );

        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading friend requests:', error);
        this.isLoading = false;
      },
    });
  }

  switchTab(tab: 'received' | 'sent') {
    this.activeTab = tab;
  }

  async acceptRequest(request: FriendRequestWithUser) {
    try {
      await this.friendService.acceptFriendRequest(request.id);
      // Request will be automatically removed from the list via subscription
    } catch (error) {
      console.error('Error accepting friend request:', error);
      alert('Failed to accept friend request');
    }
  }

  async declineRequest(request: FriendRequestWithUser) {
    try {
      await this.friendService.declineFriendRequest(request.id);
      // Request will be automatically removed from the list via subscription
    } catch (error) {
      console.error('Error declining friend request:', error);
      alert('Failed to decline friend request');
    }
  }

  async cancelRequest(request: FriendRequestWithUser) {
    try {
      await this.friendService.cancelFriendRequest(request.id);
      // Request will be automatically removed from the list via subscription
    } catch (error) {
      console.error('Error canceling friend request:', error);
      alert('Failed to cancel friend request');
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
    this.router.navigate(['/friends/list']);
  }
}
