import {Component, Input, OnInit} from '@angular/core';
import {NGXLogger} from 'ngx-logger';
import {MasterDataService} from '../../master-data.service';
import {ApiService} from '../../api.service';
import {Area} from '../../../domain/area';

export declare type AreaDisplaySize = 'small' | 'medium' | 'big';

/**
 * Usage: <app-area-display [areaCode]="row.areaCode" size="big"></app-area-display>
 */
@Component({
  selector: 'app-area-display',
  templateUrl: './area-display.component.html',
  styleUrls: ['./area-display.component.scss']
})
export class AreaDisplayComponent implements OnInit {

  areas: Area[] = [];
  @Input() areaCode: string;
  @Input() size: AreaDisplaySize = 'medium';
  title = '';

  constructor(private api: ApiService, private logger: NGXLogger, public masterData: MasterDataService) {
  }

  ngOnInit(): void {
    this.masterData.countries
      .subscribe((res: any) => {
        this.areas = res;
        for (const area of this.areas) {
          if (area.code === this.areaCode) {
            this.title = area.name;
            break;
          }
        }
        // this.logger.debug(res); code,name,parentCode,level
        // this.logger.debug(`AreaDisplayComponent getCountries() ${this.areas.length} items`);
      }, err => {
        this.logger.error(err);
      });
  }

}
