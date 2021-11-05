import {Component, Inject, OnInit} from '@angular/core';
import {LocationDetailsComponent} from '@app/locations/location-details.component';
import {Post} from '@domain/location';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {ManagedEntity} from '@shared/domain/entities';
import {AuthService} from '@shared/services/auth.service';
import {FormBuilder} from '@angular/forms';
import {NGXLogger} from 'ngx-logger';
import {PostStoreService} from '@app/locations/posts/post-store.service';

@Component({
  selector: 'app-post-details',
  templateUrl: '../location-details.component.html',
  styleUrls: []
})
export class PostDetailsComponent extends LocationDetailsComponent<Post> implements OnInit {
  // protected readonly className = 'PostDetailsComponent';

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: ManagedEntity, // TODO use Dialog data specific object, but ManagedEntity at least supports id
    public authService: AuthService, // used in form to check if edit is allowed
    public dialogRef: MatDialogRef<PostDetailsComponent>,
    public store: PostStoreService,
    protected formBuilder: FormBuilder,
    protected logger: NGXLogger
  ) {
    super(data, dialogRef, store, formBuilder, logger);
  }

  ngOnInit(): void {
    super.ngOnInit();
  }

}
