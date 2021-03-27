import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {FormArray, FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {NGXLogger} from 'ngx-logger';
import {Area} from '@app/domain/area';
import {DefaultErrorStateMatcher} from '@shared/helpers/form-helper';
import {ListType, MasterDataService} from '@shared/services/master-data.service';
import {REGEXP_COORDINATES, SmartCoordinates} from '@shared/domain/smart-coordinates';
import {MatSnackBar} from '@angular/material/snack-bar';
import {AuthService} from '@shared/services/auth.service';
import {COMMA, ENTER} from '@angular/cdk/keycodes';
import {FileService} from '@shared/modules/imagine/file.service';
import {EntityType} from '@shared/domain/entities';
import {ApiHelper} from '@shared/helpers/api-helper';
import {PlaceStoreService} from '../place-store.service';
import {ListItem} from '@shared/domain/list-item';

@Component({
  selector: 'app-place-edit',
  templateUrl: './place-edit.component.html',
  styleUrls: ['../../shared/components/common.component.scss']
})
export class PlaceEditComponent implements OnInit {

  countries: Area[] = [];
  locationTypes: ListItem[];
  authScopes: ListItem[];
  formData: FormGroup;
  id = '';
  readonly separatorKeysCodes: number[] = [ENTER, COMMA];   // For Tag support
  matcher = new DefaultErrorStateMatcher();

  constructor(public store: PlaceStoreService,
              private fileService: FileService,
              private formBuilder: FormBuilder,
              private logger: NGXLogger,
              private route: ActivatedRoute,
              private router: Router,
              private snackBar: MatSnackBar,
              public authService: AuthService,
              public masterData: MasterDataService) {
  }

  ngOnInit() {
    this.loadItem(this.route.snapshot.params.id);

    this.masterData.countries
      .subscribe((res: any) => {
        this.countries = res;
        this.logger.debug(`PlaceEditComponent getCountries() ${this.countries.length} items`);
      }, err => {
        this.logger.error(err);
      });

    this.formData = this.formBuilder.group({
      name: [null, Validators.required],
      areaCode: [null, Validators.required],
      locationType: [null, Validators.required],
      authScope: [null, Validators.required],
      summary: [null],
      notes: [null],
      coordinatesStr: [null],
      primaryUrl: [null],
      imageUrl: [null],
      tags: this.formBuilder.array([])
    });

    this.locationTypes = this.masterData.getLocationTypes();
    this.authScopes = this.masterData.getList(ListType.AUTH_SCOPE);
  }

  // get initial value of selecbox base on enum value provided by backend
  getSelectedLotype(): ListItem {
    return this.masterData.lookupLocationType(this.formData.get('locationType').value);
  }

  // todo make component
  getSelectedAuthScope(): ListItem {
    return this.masterData.getListItem(ListType.AUTH_SCOPE, this.formData.get('authScope').value);
  }

  loadItem(id: any) {
    this.store.getItem(id).subscribe((data: any) => {
      this.id = data.id;
      // use patch on the reactive form data, not set. See
      // https://stackoverflow.com/questions/51047540/angular-reactive-form-error-must-supply-a-value-for-form-control-with-name
      this.formData.patchValue({
        name: data.name,
        summary: data.summary,
        notes: data.notes,
        areaCode: data.areaCode,
        imageUrl: data.imageUrl,
        primaryUrl: data.primaryUrl,
        locationType: data.locationType,
        authScope: data.authScope,
        coordinatesStr: (Array.isArray((data.coordinates)) && (data.coordinates.length > 1)) ? `${data.coordinates[1]},${data.coordinates[0]}` : null
      });
      // patch didn't work if the form is an array, this workaround does. See
      // https://www.cnblogs.com/Answer1215/p/7376987.html [Angular] Update FormArray with patchValue
      if (data.tags) {
        for (const item of data.tags) {
          (this.formData.get('tags') as FormArray).push(new FormControl(item));
        }
      }
    });
  }

  // Receive event from child if image is selected https://fireship.io/lessons/sharing-data-between-angular-components-four-methods/
  receiveImageMessage($event) {
    this.logger.info(`Received image event ${$event} from child component`);
    const newImageUrl = $event;
    if (this.formData.value.imageUrl === newImageUrl) {
      this.snackBar.open(`This image is already set as title`, 'Close');
    } else {
      this.formData.patchValue({imageUrl: newImageUrl});
      this.snackBar.open(`Set new title image: ${newImageUrl} `, 'Close');
    }
  }

  onFormSubmit() {
    const item = this.formData.value;
    // Todo: validate update coordindates array after they've been entered, not shortly before submit
    if (item.coordinatesStr) {
      const sco = new SmartCoordinates((item.coordinatesStr));
      item.coordinates = sco.lonLatArray;
      this.logger.debug('coordinates', sco);
      delete item.coordinatesStr;
    }
    this.logger.debug('PlaceEditComponent.submit', item);
    this.store.updateItem(this.id, this.formData.value)
      .subscribe((res: any) => {
          this.navigateToItemDetails(res.id);
        }, (err: any) => {
          this.logger.error(err);
        }
      );
  }

  navigateToItemDetails(id = this.id) {
    const entityPath = ApiHelper.getApiPath(EntityType.Place);
    this.router.navigate([`/${entityPath}/details`, id]);
  }

}
