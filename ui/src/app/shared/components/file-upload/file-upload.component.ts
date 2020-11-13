import {Component, Input, OnInit} from '@angular/core';
import {HttpEventType, HttpResponse} from '@angular/common/http';
import {FileService} from '../../file.service';
import {MatSnackBar} from '@angular/material/snack-bar';
import {EntityType} from '../../../domain/common';
import {NGXLogger} from 'ngx-logger';

@Component({
  selector: 'app-file-upload',
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.scss']
})
export class FileUploadComponent implements OnInit {

  @Input() entityId: string;
  @Input() entityType: string;
  // https://medium.com/@altissiana/how-to-pass-a-function-to-a-child-component-in-angular-719fc3d1ee90
  @Input() refreshCallback: (args: any) => void;

  selectedFiles: FileList;
  currentFileUpload: File;
  progress: { percentage: number } = {percentage: 0};
  selectedFile = null;
  changeImage = false;

  constructor(private fileService: FileService,
              private logger: NGXLogger,
              private snackBar: MatSnackBar) {
  }

  ngOnInit(): void {
  }


  change($event) {
    this.changeImage = true;
  }

  changedImage(event) {
    this.selectedFile = event.target.files[0];
  }

  // this one gets triggered by the upload button
  upload() {
    this.progress.percentage = 0;
    this.currentFileUpload = this.selectedFiles.item(0);
    this.fileService.uploadFile(this.currentFileUpload, EntityType[this.entityType], this.entityId).subscribe(event => {
        if (event.type === HttpEventType.UploadProgress) {
          this.progress.percentage = Math.round(100 * event.loaded / event.total);
        } else if (event instanceof HttpResponse) {
          const body = (event as HttpResponse<any>).body;
          this.logger.debug('File Successfully uploaded');
          this.snackBar.open(`File Successfully uploaded: ${body}`, 'Close');
        }
        this.selectedFiles = undefined;
      }
    );
  }

  selectFile(event) {
    this.selectedFiles = event.target.files;
  }

  refresh() {
    if (this.refreshCallback) {
      this.logger.info('Invoking refresh callback');
      this.refreshCallback('from hase');
    } else {
      this.logger.debug('no refresh callbag registered');
    }
  }

  /*
downloadFile() {
  const link = document.createElement('a');
  link.setAttribute('target', '_blank');
  link.setAttribute('href', '_File_Saved_Path');
  link.setAttribute('download', 'file_name.pdf');
  document.body.appendChild(link);
  link.click();
  link.remove();
}
 */

}
