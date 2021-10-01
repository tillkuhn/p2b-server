import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ToursComponent } from './tours.component';
import {CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import {MatIconTestingModule} from '@angular/material/icon/testing';
import {MatCardModule} from '@angular/material/card';
import {LayoutModule} from '@angular/cdk/layout';
import {LoggerTestingModule} from 'ngx-logger/testing';
import {RouterTestingModule} from '@angular/router/testing';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {MatDialogModule} from '@angular/material/dialog';
import {MatTabsModule} from '@angular/material/tabs';
import {MatTableModule} from '@angular/material/table';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {MatInputModule} from '@angular/material/input';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {MatIconModule} from '@angular/material/icon';
import {WebStorageModule} from 'ngx-web-storage';
import {FormatDistanceToNowPipeModule} from 'ngx-date-fns';

describe('ToursComponent', () => {
  let component: ToursComponent;
  let fixture: ComponentFixture<ToursComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ToursComponent ],
      schemas: [
        CUSTOM_ELEMENTS_SCHEMA
      ],
      imports: [MatIconTestingModule, MatCardModule, LayoutModule, LoggerTestingModule, RouterTestingModule,
        HttpClientTestingModule, MatDialogModule, MatTabsModule, MatTableModule,
        FormsModule, ReactiveFormsModule, MatSnackBarModule, MatInputModule,
        BrowserAnimationsModule, MatIconModule, WebStorageModule, FormatDistanceToNowPipeModule]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ToursComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
