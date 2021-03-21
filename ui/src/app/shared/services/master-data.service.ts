import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {NGXLogger} from 'ngx-logger';
import {Observable, Subject} from 'rxjs';
import {Area} from '../../domain/area';
import {environment} from '../../../environments/environment';
import {filter, shareReplay, takeUntil, tap} from 'rxjs/operators';
import {ListItem} from '../../domain/list-item';
import {NotificationService} from './notification.service';
import {EntityType} from '../../domain/entities';

const CACHE_SIZE = 1;

export enum ListType {
  NOTE_STATUS,
  AUTH_SCOPE
}
export const DEFAULT_AUTH_SCOPE = 'RESTRICTED';
export const NOTE_STATUS_CLOSED = 'CLOSED'; // Todo not so nice

@Injectable({
  providedIn: 'root'
})
// Caching inspired by https://blog.thoughtram.io/angular/2018/03/05/advanced-caching-with-rxjs.html
export class MasterDataService {
  private readonly className = 'MasterDataService';

  private datastore: Map<ListType, Map<string, ListItem>>;

  private countriesCache$: Observable<Area[]>;
  private reload$ = new Subject<void>();

  private locationTypes: Array<ListItem>;
  private locationTypesLookup: Map<string, number> = new Map();

  constructor(private http: HttpClient,
              private notifier: NotificationService,
              private logger: NGXLogger) {
    this.onInit();
  }

  onInit(): void {
    // Subscribe to new notifications for entity updates etc.
    this.notifier.notification$
      .pipe(
        filter(event => event.entityType === EntityType.Place) // right not we're no interested in other entities
      )
      .subscribe(event => this.logger.debug(`${this.className} Received event ${JSON.stringify(event)}`));

    this.datastore = new Map<ListType, Map<string, ListItem>>();
    Object.keys(ListType).filter(
      key => !isNaN(Number(ListType[key]))
    ).forEach(
      entry => this.datastore.set(ListType[entry], new Map<string, ListItem>())
    );
    this.addStaticListItem(ListType.NOTE_STATUS, {label: 'Open', icon: 'new_releases', value: 'OPEN'});
    this.addStaticListItem(ListType.NOTE_STATUS, {label: 'In progress', icon: 'pending', value: 'IN_PROGRESS'});
    this.addStaticListItem(ListType.NOTE_STATUS, {label: 'Impeded', icon: 'security', value: 'IMPEDED'});
    this.addStaticListItem(ListType.NOTE_STATUS, {label: 'Closed', icon: 'cancel', value: NOTE_STATUS_CLOSED});

    // todo export declare type AuthScope = 'PUBLIC' | 'ALL_AUTH' | 'RECTRICTED' | 'PRIVATE';
    this.addStaticListItem(ListType.AUTH_SCOPE, {label: 'Public', icon: 'lock_open', value: 'PUBLIC'});
    this.addStaticListItem(ListType.AUTH_SCOPE, {label: 'Authenticated', icon: 'lock', value: 'ALL_AUTH'});
    this.addStaticListItem(ListType.AUTH_SCOPE, {label: 'Restricted', icon: 'security', value: 'RESTRICTED'});
    this.addStaticListItem(ListType.AUTH_SCOPE, {label: 'Private', icon: 'fence', value: 'PRIVATE'});

    // For Maki alternative icons check: https://labs.mapbox.com/maki-icons/
    this.locationTypes = [
      {label: 'Place', icon: 'place', maki: 'attraction', value: 'PLACE'},
      {label: 'Accomodation', icon: 'hotel', maki: 'suitcase', value: 'ACCOM'},
      {label: 'Bar & Food', icon: 'restaurant', maki: 'fast-food', value: 'BARFOOD'},
      {label: 'Beach & Island', icon: 'beach_access', maki: 'beach', value: 'BEACH'},
      {label: 'Biketrip', icon: 'directions_bike', maki: 'bicycle', value: 'BIKE'},
      {label: 'Citytrip', icon: 'location_city', maki: 'town-hall', value: 'CITY'},
      {label: 'Excursion & Hiking', icon: 'directions_walk', maki: 'veterinary', value: 'EXCURS'},
      {label: 'Monument & Temple', icon: 'account_balance', maki: 'castle', value: 'MONUM'},
      {label: 'Mountain & Skiing', icon: 'ac_unit', maki: 'mountain', value: 'MOUNT'},
      {label: 'Roadtrip Destination', icon: 'directions_car', maki: 'car', value: 'ROAD'}
    ];
    this.locationTypes.forEach((item, i) => this.locationTypesLookup.set(item.value, i));
  }

  get countries() {
    // This shareReplay operator returns an Observable that shares a single subscription
    // to the underlying source, which is the Observable returned from this.requestCountriesWithRegions()
    // https://blog.thoughtram.io/angular/2018/03/05/advanced-caching-with-rxjs.html
    if (!this.countriesCache$) {
      this.countriesCache$ = this.requestCountries().pipe(
        takeUntil(this.reload$),
        shareReplay(CACHE_SIZE)
      );
    }
    return this.countriesCache$;
  }

  getList(listType: ListType): Array<ListItem> {
    return Array.from(this.datastore.get(listType).values());
  }

  getListItem(listType: ListType, key: string): ListItem {
    return this.datastore.get(listType).get(key);
  }

  getAuthScope(key: string) {
    return this.getListItem(ListType.AUTH_SCOPE, key);
  }

  getLocationTypes() {
    return this.locationTypes;
  }

  lookupLocationType(itemValue: string) {
    // this.logger.debug('checl loc ' +itemValue);
    return this.locationTypes[this.locationTypesLookup.get(itemValue)];
  }

  forceReload() {
    // Calling next will complete the current cache instance
    this.reload$.next();

    // Setting the cache to null will create a new cache the next time 'countries' is called
    this.countriesCache$ = null;
    this.logger.debug(`${this.className} All master-data caches invalidated`);
  }

  private addStaticListItem(listType: ListType, listItem: ListItem) {
    this.datastore.get(listType).set(listItem.value, listItem);
  }

  private requestCountries(): Observable<Area[]> {
    return this.http.get<Area[]>(`${environment.apiUrlRoot}/areas/countries`)
      .pipe(
        tap(items => this.logger.debug(`MasterDataService fetched ${items.length} countries from server`))
        /*, catchError(this.handleError('getCountries', []))*/
      );
  }

}
