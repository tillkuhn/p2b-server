import {ActivatedRoute, Router} from '@angular/router';
import {AuthService} from '@shared/services/auth.service';
import {Component, OnDestroy, OnInit} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {NGXLogger} from 'ngx-logger';
import {Subject} from 'rxjs';
import {TourDetailsComponent} from '@app/locations/tours/tour-details.component';
import {Location} from '@domain/location';
import {Location as AngularLocation} from '@angular/common';
import {debounceTime, distinctUntilChanged, filter, switchMap, takeUntil} from 'rxjs/operators';
import {EntityMetadata, EntityType, EntityTypeInfo} from '@shared/domain/entities';
import {LocationStoreService} from '@app/locations/location-store.service';
import {VideoDetailsComponent} from '@app/locations/videos/video-details.component';
import {ComponentType} from '@angular/cdk/portal';
import {WithDestroy} from '@shared/mixins/with-destroy';
import {MasterDataService} from '@shared/services/master-data.service';
import {PostDetailsComponent} from '@app/locations/posts/post-details.component';
import {EntityDialogRequest, EntityDialogResponse} from '@app/locations/entity-dialog';
import {ListItem} from '@shared/domain/list-item';

@Component({
  selector: 'app-location-list',
  templateUrl: './location-search.component.html',
  styleUrls: [
    '../../shared/components/chip-list/chip-list.component.scss', // so you can use coloured chip classes
    '../../shared/components/common.component.scss', // for mat elevation etc.
    './location-search.component.scss' // dedicated for this component
  ]
})
export class LocationSearchComponent extends WithDestroy() implements OnDestroy, OnInit {

  private readonly className = 'LocationSearchComponent';

  readonly entityTypes: Array<EntityTypeInfo> = [
    EntityMetadata[EntityType.Place],
    EntityMetadata[EntityType.Tour],
    EntityMetadata[EntityType.Video],
    EntityMetadata[EntityType.Post],
  ];

  // properties for advanced search
  toggleShowHide = false;
  sortProperties: ListItem[] = [
    {value: 'name', label: 'Name'},
    {value: 'areaCode', label: 'Region'},
    // {value: 'locationType', label: 'Type'},
    {value: 'updatedAt', label: 'Updated'},
    {value: 'authScope', label: 'Authscope'}
  ];

  entityType: EntityType; // set by ngInit based on route data
  items: Location[] = [];
  keyUp$ = new Subject<string>();
  minSearchTermLength = 1; // min number of keyed in chars to trigger a search

  constructor(
    public authService: AuthService,
    public masterData: MasterDataService,
    public store: LocationStoreService,
    private dialog: MatDialog,
    private location: AngularLocation, // Alias for Location, a service that applications can use to interact with a browser's URL.
    private logger: NGXLogger,
    private route: ActivatedRoute,
    private router: Router,
  ) {
    // super(store, logger);
    super();
  }

  ngOnInit(): void {
    // Get router data, only works for components that don't navigate: https://stackoverflow.com/a/46697826/4292075
    this.entityType = this.route.snapshot.data.entityType;
    this.logger.info(`${this.className}.ngOnInit(): Warming up for entityType=${this.entityType}`);

    this.store.searchRequest.primarySortProperty = 'updatedAt';
    this.store.searchRequest.sortDirection = 'DESC';
    this.store.searchRequest.entityTypes = [this.entityType];

    this.keyUp$.pipe(
      filter(term => term.length >= this.minSearchTermLength),
      debounceTime(500),
      distinctUntilChanged(),
      switchMap(() => this.store.searchItems()),
      takeUntil(this.destroy$), // avoid leak https://stackoverflow.com/a/41177163/4292075 (take this.destroy$ from mixin)
    ).subscribe(items => this.items = items,
      () => {
      },
      () => this.logger.info(`${this.className}.ngOnInit(): Search completed`)
    );

    // if called with id (e.g. /videos/12345), open details panel (deeplink)
    if (this.route.snapshot.params?.id) {
      const detailsId = this.route.snapshot.params.id;
      this.logger.debug(`${this.className}.ngOnInit(): Deeplink for id ${detailsId}, invoke dialog`);
      this.openDetailsDialog(detailsId, this.entityType);
      // else run initial search on page load, comment out if you want to have the search triggered by user interaction
    } else {
      this.runSearch();
    }
  }

  runSearch() {
    this.store.searchItems().subscribe(items => this.items = items);
  }

  // onMapboxStyleChange is triggered when the user selects a different style, e.g. switches to street view
  onEntityTypesChange(entry: { [key: string]: any }) {
    this.logger.info(`${this.className} Switch to entityType Filter ${entry.id}`);
    // TODO Support Multi Entity Search (MESs :-))
    this.store.searchRequest.entityTypes = [entry.id];
    this.runSearch();
  }

  previewImageUrl(item: Location) {
    if (!item.imageUrl) {
      return EntityMetadata[item.entityType].iconUrl;
      // See videos/README.adoc replace high res image with small (default.jpg) 120px image to save bandwidth
    } else if (item.imageUrl.toLowerCase().startsWith('https://img.youtube.com/')) {
      return item.imageUrl.replace('/sddefault.jpg', '/default.jpg');
      // example /imagine/places/a515f07b-2871-4d62-ad6d-d5109545279d/view_mini.jpg?large
    } else if (item.imageUrl.startsWith('/imagine/')) {
      return item.imageUrl.replace('?large', '?small');
    } else {
      return item.imageUrl;
    }
  }

  /**
   * Router link for action (e.g. play video)
   */
  routerLink(item: Location) {
    let path: string;
    switch (item.entityType) {
      case EntityType.Video:
        path = `/player/${item.id}`;
        break;
      default:
        this.logger.trace(`${item.entityType} router link not yet supported`);
    }
    return path;
  }

  /**
   *   Open Details Modal Panel
   *   delegate to entity specific component which loads the entity by id
   *   rowIndex is used to update the list element once the dialog is closed (if it has been updated)
   */
  openDetailsDialog(id: string, entityType: EntityType, rowIndex: number = -1): void {
    // append id to location path (unless it's already there)
    // so we can bookmark (see notes.component.ts)
    // Todo since location search allows to change the initial entityType, we must also change the entityType path in the
    // URL (e.g. /tours/123345 /videos/123345 if the initial call to search went to tours
    const locationPathBeforeOpen = this.location.path();
    if (locationPathBeforeOpen.indexOf(id) < 0) {
      this.location.go(`${locationPathBeforeOpen}/${id}`);
     }

    let componentClass: ComponentType<unknown>;
    switch (entityType) {
      case EntityType.Video:
        componentClass = VideoDetailsComponent;
        break;
      case EntityType.Tour:
        componentClass = TourDetailsComponent;
        break;
      case EntityType.Post:
        componentClass = PostDetailsComponent;
        break;
      case EntityType.Place:
        // componentClass = PostDetailsComponent;
        this.logger.warn(`EntityType ${entityType} Special Temporary handling reroute to details` );
        this.router.navigate([`/places/details`, id]).then(); // swallow returned promise
        return;
        // break;
      default:
        throw new Error(`EntityType ${entityType} not yet supported in this component`);
    }
    const dialogRequest: EntityDialogRequest = {
      id, // object shorthand literal (id: id)
      mode: 'View',
    };
    const dialogRef = this.dialog.open(componentClass, {
      // width: '75%', maxWidth: '600px',
      // dims etc. now defined centrally in styles.scss (with .mat-dialog-container)
      panelClass: 'app-details-panel',
      data: dialogRequest,
    });

    // Callback when the dialog is closed, most importantly to have list elements reflect the changes immediately
    dialogRef.afterClosed().subscribe((response: EntityDialogResponse<Location>) => {
      this.location.go(locationPathBeforeOpen); // restore previous path (the one w/o id)
      this.logger.debug(`${this.className}.dialogRef.afterClosed: result=${response.result} updItem=${response.entity?.name}`);
      switch (response.result) {
        case 'Updated':
          if (! response.entity ) {
            this.logger.warn(`${this.className}: no entity returned, cannot update list`);
          } else {
            this.items[rowIndex] = response.entity; // updated row in current list
          }
          break;
        case 'Deleted':
          if (rowIndex > -1) {
            this.items.splice(rowIndex, 1);
          }
          break;
      }
    });

  }


  // Make sure to include shared/components/chip-list/chip-list.component.scss'
  // shared/components/chip-list/chip-list.component.scss'
  // Currently supported: red, green, blue, sand
  getChipClass(tag: string) {
    let suffix = '';
    if (tag === 'bike' || tag === 'mtb' || tag === 'touringbicycle') {
      suffix = '-green';
    } else if (tag === 'hike') {
      suffix = '-sand';
    }
    return `app-chip${suffix}`;
  }

  /* Maybe re-use in location Details
   rateUp(tour: Tour): void {
     tour.rating = tour.rating + 1;
     this.update(tour);
   }

   rateDown(tour: Tour): void {
     tour.rating = (tour.rating > 0) ? tour.rating - 1 : 0;
     this.update(tour);
   }

   private update(tour: Tour) {
     this.logger.info(`${tour.id} new rating ${tour.rating}`);
     this.store.updateItem(tour.id, tour).subscribe(updatedItem => tour = updatedItem);
   }
   */

}
