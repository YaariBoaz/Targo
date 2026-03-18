import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FirebaseService } from '@shared/services/firebase.service';
import { UserService } from '@shared/services/user.service';
import { FriendService } from '@shared/services/friend.service';
import { User } from '@models/user.model';

interface UserWithStatus extends User {
  friendshipStatus: 'none' | 'pending' | 'accepted' | 'sent';
  isOnline: boolean;
}

@Component({
  selector: 'app-add-friends',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-friends.page.html',
  styleUrls: ['./add-friends.page.scss'],
})
export class AddFriendsPage implements OnInit {
  private router = inject(Router);
  private firebase = inject(FirebaseService);
  private userService = inject(UserService);
  private friendService = inject(FriendService);

  searchQuery = '';
  users: UserWithStatus[] = [];
  isLoading = false;

  async ngOnInit() {
    await this.waitForAuth();
    await this.loadAllUsers();
  }

  private waitForAuth(): Promise<void> {
    return new Promise((resolve) => {
      if (this.firebase.auth.currentUser) {
        resolve();
        return;
      }
      const unsubscribe = this.firebase.auth.onAuthStateChanged((user) => {
        unsubscribe();
        resolve();
      });
    });
  }

  private async loadAllUsers() {
    this.isLoading = true;
    try {
      const currentUser = this.firebase.auth.currentUser;
      if (!currentUser) {
        console.log('User not authenticated, skipping load');
        this.isLoading = false;
        return;
      }

      const users = await this.userService.getAllUsers();
      await this.processUsers(users);
    } catch (error) {
      console.error('Error loading users:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
    }
    this.isLoading = false;
  }

  private async processUsers(users: any[]) {
    const currentUserId = this.firebase.auth.currentUser?.uid;
    if (!currentUserId) return;

    // Filter out current user
    const filteredUsers = users.filter((u) => u.uid !== currentUserId);

    // Get friendship status for each user
    const usersWithStatus: UserWithStatus[] = await Promise.all(
      filteredUsers.map(async (user) => {
        try {
          const status = await this.friendService.getFriendshipStatus(
            currentUserId,
            user.uid
          );
          return {
            ...user,
            friendshipStatus: status,
            isOnline: false,
          };
        } catch (e) {
          // If checking status fails, default to 'none' so we can still see the user
          console.warn(`Could not check friendship for ${user.uid}`, e);
          return { ...user, friendshipStatus: 'none', isOnline: false };
        }
      })
    );

    this.users = usersWithStatus;
  }

  async onSearchChange() {
    this.isLoading = true;
    try {
      const users = this.searchQuery.trim()
        ? await this.userService.searchUsers(this.searchQuery)
        : await this.userService.getAllUsers();
      await this.processUsers(users);
    } catch (error) {
      console.error('Error searching users:', error);
    }
    this.isLoading = false;
  }

  async sendFriendRequest(user: UserWithStatus) {
    const currentUserId = this.firebase.auth.currentUser?.uid;
    if (!currentUserId) return;

    try {
      await this.friendService.sendFriendRequest(currentUserId, user.uid);
      user.friendshipStatus = 'sent';
    } catch (error: any) {
      console.error('Error sending friend request:', error);
      alert(error.message || 'Failed to send friend request');
    }
  }

  async cancelFriendRequest(user: UserWithStatus) {
    const currentUserId = this.firebase.auth.currentUser?.uid;
    if (!currentUserId) return;

    try {
      const friendshipId = this.friendService.getFriendshipId(
        currentUserId,
        user.uid
      );
      await this.friendService.cancelFriendRequest(friendshipId);
      user.friendshipStatus = 'none';
    } catch (error) {
      console.error('Error canceling friend request:', error);
      alert('Failed to cancel friend request');
    }
  }

  getButtonText(status: string): string {
    switch (status) {
      case 'accepted':
        return 'Friends';
      case 'sent':
        return 'Request Sent';
      case 'pending':
        return 'Accept';
      default:
        return 'Add Friend';
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
