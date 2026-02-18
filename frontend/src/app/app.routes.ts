import { Routes } from '@angular/router';
import { Landing } from './landing/landing';
import { Login } from './auth/login/login';
import { Register } from './auth/register/register';

export const routes: Routes = [
  { path: '', component: Landing },
  { path: 'auth/login', component: Login },
  { path: 'auth/register', component: Register },
  { path: '**', redirectTo: '' },
];
