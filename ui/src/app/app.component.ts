import {Component, OnInit} from '@angular/core';
import {MatIconRegistry} from '@angular/material/icon';
import {DomSanitizer} from '@angular/platform-browser';
import {Observable} from 'rxjs';
import {BreakpointObserver, Breakpoints} from '@angular/cdk/layout';
import {catchError, map, shareReplay, tap} from 'rxjs/operators';
import {MatSnackBar} from '@angular/material/snack-bar';
import {LoadingService} from './shared/loading.service';
import {MatSidenav} from '@angular/material/sidenav';
import {MatDrawerToggleResult} from '@angular/material/sidenav/drawer';
import {EnvironmentService} from './environment.service';
import {NGXLogger} from 'ngx-logger';
import {AuthService} from './shared/auth.service';
import {User} from './domain/user';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {

  title = 'TiMaFe on Air';
  isLoading: boolean;

  constructor(private breakpointObserver: BreakpointObserver,
              private snackBar: MatSnackBar, public loadingService: LoadingService,
              public authService: AuthService,

              private logger: NGXLogger
  ) {
  }

  isHandset$: Observable<boolean> = this.breakpointObserver.observe(Breakpoints.Handset)
    .pipe(
      map(result => result.matches),
      shareReplay()
    );

  ngOnInit() {
    this.loadingService.isLoading.subscribe(async data => {
      this.isLoading = await data;
    });
  }

  /** Result of the toggle promise that indicates the state of the drawer. */
// export declare type MatDrawerToggleResult = 'open' | 'close';
// https://angular.io/guide/observables-in-angular
  closeIfHandset(drawer: MatSidenav): Promise<MatDrawerToggleResult> {
    return new Promise<MatDrawerToggleResult>((resolve, reject) => {
      this.isHandset$.subscribe(isHandset => {
        if (isHandset) {
          drawer.close().then(result => {
            if (result !== 'close') this.logger.warn('unexpected return state ' + result + ' during close drawer');
          });
          resolve('close');
        } else {
          this.logger.debug('deskop mode, keep open');
          resolve('open');
        }
      });
    });
  }

}
