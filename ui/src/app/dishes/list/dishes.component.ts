import {Component, OnInit} from '@angular/core';
import {ApiService} from '../../shared/api.service';
import {EnvironmentService} from '../../shared/environment.service';
import {NGXLogger} from 'ngx-logger';
import {Dish} from '../../domain/dish';
import {MasterDataService} from '../../shared/master-data.service';
import {Subject} from 'rxjs';
import {debounceTime, distinctUntilChanged, filter, switchMap, tap} from 'rxjs/operators';

@Component({
  selector: 'app-dishes',
  templateUrl: './dishes.component.html',
  styleUrls: ['./dishes.component.scss']
})
export class DishesComponent implements OnInit {

  minSearchTermLength = 0;
  displayedColumns: string[] = ['areaCode', 'name', 'authScope', 'primaryUrl'];
  data: Dish[] = [];
  search = '';
  keyUp$ = new Subject<string>();
  isLoading = false;

  constructor(private logger: NGXLogger,
              private api: ApiService,
              private env: EnvironmentService,
              private masterData: MasterDataService
              ) {
  }

  ngOnInit() {
    this.keyUp$.pipe(
      filter(term => term.length >= this.minSearchTermLength),
      debounceTime(500),
      distinctUntilChanged(),
      tap(() => this.isLoading = true),
      switchMap(searchTerm => this.getItems(searchTerm)),
      tap(() => this.isLoading = false)
    ).subscribe(dishes => this.data = dishes);

    this.getItems('').subscribe(items => this.data = items);
  }

  // https://medium.com/@ole.ersoy/creating-a-conditional-clear-button-on-our-angular-material-search-field-3e2e155c6edb
  clearSearch() {
    this.search = '';
    this.getItems('').subscribe(items => this.data = items);
  }

  getItems(searchTerm: string) {
    return this.api.getDishes(searchTerm);
  }

}
