import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {NGXLogger} from 'ngx-logger';
import {EntityEventService} from '@shared/services/entity-event.service';
import {EntityType} from '@shared/domain/entities';
import {EntityStore} from '@shared/services/entity-store';
import {ApiHelper} from '@shared/helpers/api-helper';
import {ApiTour, Tour} from '@domain/tour';

@Injectable({
  providedIn: 'root'
})
export class TourStoreService  extends EntityStore<Tour, ApiTour>  {
  constructor(http: HttpClient,
              logger: NGXLogger,
              events: EntityEventService
  ) {
    super(http, logger, events);
  }

  // list of tags that may be suggested as tags for this entity

  entityType(): EntityType {
    return EntityType.Note;
  }

  // override standard mapper in superclass
  mapFromApiEntity(apiEntity: ApiTour): Tour {
    return {
      ...apiEntity,
      createdAt: ApiHelper.parseISO(apiEntity.createdAt),
    };
  }

  // override standard mapper in superclass
  protected mapToApiEntity(uiEntity: Tour): ApiTour {
    // https://ultimatecourses.com/blog/remove-object-properties-destructuring
    const {
      createdAt, // remove
      ...rest  // ... what remains
    } = uiEntity;
    return {
      ...rest,
    };
  }
}
