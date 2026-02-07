import { Routes } from '@angular/router';
import { Login } from './components/login/login';
import { Register } from './components/register/register';
import { Home } from './components/home/home';
import { MovieDetailsComponent } from './components/movie-details/movie-details';
import { ProfileComponent } from './components/profile/profile';
import { ListsComponent } from './components/lists/lists';
import { ListDetailsComponent } from './components/list-details/list-details';
import { WatchlistComponent } from './components/watchlist/watchlist';
import { FeedComponent } from './components/feed/feed';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'home', component: Home, canActivate: [authGuard] },
  { path: 'movie/:id', component: MovieDetailsComponent, canActivate: [authGuard] },
  { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },
  { path: 'lists', component: ListsComponent, canActivate: [authGuard] },
  { path: 'list-details/:id', component: ListDetailsComponent, canActivate: [authGuard] },
  { path: 'watchlist', component: WatchlistComponent, canActivate: [authGuard] },
  { path: 'feed', component: FeedComponent, canActivate: [authGuard] },
  // { path: '**', redirectTo: '/home' }
];
