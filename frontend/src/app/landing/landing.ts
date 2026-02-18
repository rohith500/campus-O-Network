import { Component } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { RouterModule } from '@angular/router';

interface Feature {
  icon: string;
  title: string;
  description: string;
  color: string;
}

@Component({
  selector: 'app-landing',
  imports: [
    MatToolbarModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatChipsModule,
    RouterModule,
  ],
  templateUrl: './landing.html',
  styleUrl: './landing.css',
})
export class Landing {
  features: Feature[] = [
    {
      icon: 'dynamic_feed',
      title: 'Campus Feed',
      description:
        'Stay connected with real-time updates, announcements, and posts from across your entire campus community.',
      color: '#6C63FF',
    },
    {
      icon: 'groups',
      title: 'Study Groups',
      description:
        'Form or join study groups for any subject. Collaborate, share resources, and ace your courses together.',
      color: '#FF6584',
    },
    {
      icon: 'event',
      title: 'Events & Clubs',
      description:
        'Discover campus events, join clubs, and never miss out on the opportunities that shape your college experience.',
      color: '#43B89C',
    },
    {
      icon: 'chat_bubble',
      title: 'Real-time Chat',
      description:
        'Connect with peers through instant messaging, one-on-one or in group channels built for your campus.',
      color: '#FF9F43',
    },
    {
      icon: 'folder_open',
      title: 'Resource Hub',
      description:
        'Share and access lecture notes, past papers, and academic materials uploaded by fellow students.',
      color: '#4ECDC4',
    },
    {
      icon: 'person_search',
      title: 'Student Directory',
      description:
        'Find and connect with fellow students by department, year, or interest. Build your campus network effortlessly.',
      color: '#A29BFE',
    },
  ];
}
