import { ComponentFixture, TestBed } from '@angular/core/testing';

import { YoutubePlayerDemoComponent } from './youtube-player-demo.component';
import {YouTubePlayerModule} from '@angular/youtube-player';
import {FormsModule} from '@angular/forms';
import {CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import {LoggerTestingModule} from 'ngx-logger/testing';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconTestingModule} from '@angular/material/icon/testing';
import {MatSelectModule} from '@angular/material/select';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';

describe('YoutubePlayerDemoComponent', () => {
  let component: YoutubePlayerDemoComponent;
  let fixture: ComponentFixture<YoutubePlayerDemoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      schemas: [
        CUSTOM_ELEMENTS_SCHEMA
      ],
      declarations: [ YoutubePlayerDemoComponent ],
      imports: [ YouTubePlayerModule, FormsModule, LoggerTestingModule, MatFormFieldModule, MatIconTestingModule, MatSelectModule, NoopAnimationsModule]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(YoutubePlayerDemoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
