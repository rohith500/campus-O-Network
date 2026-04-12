import { Routes } from '@angular/router';
import { Landing } from './landing/landing';
import { Login } from './auth/login/login';
import { Register } from './auth/register/register';
import { Feed } from './feed/feed';
import { authGuard } from './core/auth.guard';
import { roleGuard } from './core/role.guard';
import { ClubForm } from './clubs/club-form/club-form';
import { StudyGroupsList } from './study-groups/study-groups-list';
import { StudyGroupDetail } from './study-groups/study-group-detail';
import { StudyRequestsList } from './study-groups/study-requests-list';
import { StudyRequestForm } from './study-groups/study-request-form';
import { EventForm } from './events/event-form/event-form';
import { EventsList } from './events/events-list/events-list';
import { ClubsList } from './clubs/clubs-list/clubs-list';
import { ClubView } from './clubs/club-view/club-view';
import { Profile } from './profile/profile';
import { StudentsList } from './students/students-list/students-list';
import { StudentForm } from './students/student-form/student-form';
import { StudentDetail } from './students/student-detail/student-detail';

export const routes: Routes = [
  { path: '', component: Landing },
  { path: 'auth/login', component: Login },
  { path: 'auth/register', component: Register },
  { path: 'feed', component: Feed, canActivate: [authGuard] },
  { path: 'profile', component: Profile, canActivate: [authGuard] },
  {
    path: 'students',
    component: StudentsList,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin'] },
  },
  {
    path: 'students/new',
    component: StudentForm,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin'] },
  },
  {
    path: 'students/:id',
    component: StudentDetail,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin'] },
  },
  {
    path: 'students/:id/edit',
    component: StudentForm,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin'] },
  },
  { path: 'study-groups', component: StudyGroupsList, canActivate: [authGuard] },
  { path: 'study-groups/:id', component: StudyGroupDetail, canActivate: [authGuard] },
  { path: 'study/requests', component: StudyRequestsList, canActivate: [authGuard] },
  { path: 'study/requests/new', component: StudyRequestForm, canActivate: [authGuard] },
  { path: 'events', component: EventsList, canActivate: [authGuard] },
  {
    path: 'events/new',
    component: EventForm,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin', 'ambassador', 'organizer', 'club_admin'] },
  },
  {
    path: 'events/:id/edit',
    component: EventForm,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin', 'ambassador', 'organizer', 'club_admin'] },
  },
  { path: 'clubs', component: ClubsList, canActivate: [authGuard] },
  {
    path: 'clubs/new',
    component: ClubForm,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin', 'ambassador'] },
  },
  {
    path: 'clubs/:id/edit',
    component: ClubForm,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin', 'ambassador'] },
  },
  { path: 'clubs/:id', component: ClubView, canActivate: [authGuard] },
  { path: '**', redirectTo: '' },
];
