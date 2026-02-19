import { Routes } from '@angular/router';
import { Landing } from './landing/landing';
import { Login } from './auth/login/login';
import { Register } from './auth/register/register';
import { Feed } from './feed/feed';
import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  { path: '', component: Landing },
  { path: 'auth/login', component: Login },
  { path: 'auth/register', component: Register },
  { path: 'feed', component: Feed, canActivate: [authGuard] },
  { path: '**', redirectTo: '' },
];
