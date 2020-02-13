import {Component, Directive, EventEmitter, Input, OnInit, Output, PipeTransform, QueryList, ViewChildren} from '@angular/core';
import {DecimalPipe} from '@angular/common';
import {FormControl, FormGroup} from '@angular/forms';
import {MoviesService} from '../movies.service';
import {pairwise, startWith} from 'rxjs/operators';

function search(text: string, pipe: PipeTransform, data) {
  return data.filter(item => {
    const term = text.toLowerCase();
    return item['movie_title'].toLowerCase().includes(term);
  });
}

export type SortDirection = 'asc' | 'desc' | '';
const rotate: {[key: string]: SortDirection} = { 'asc': 'desc', 'desc': '', '': 'asc' };
export const compare = (v1, v2) => v1 < v2 ? -1 : v1 > v2 ? 1 : 0;

export interface SortEvent {
  column: string;
  direction: SortDirection;
}

@Directive({
  selector: '[sortable]',
  host: {
    '[class.asc]': 'direction === "asc"',
    '[class.desc]': 'direction === "desc"',
    '(click)': 'rotate()'
  }
})
export class NgbdSortableHeader {
  @Input() sortable: string;
  @Input() direction: SortDirection = '';
  @Output() sort = new EventEmitter<SortEvent>();

  rotate() {
    this.direction = rotate[this.direction];
    this.sort.emit({column: this.sortable, direction: this.direction});
  }
}

@Component({
  selector: 'app-movies',
  templateUrl: './movies.component.html',
  styleUrls: [  './movies.component.scss'],
  providers: [DecimalPipe]
})
export class MoviesComponent implements OnInit {
  data;
  page = 1;
  pageSize = 25;
  collectionSize;
  originalData;
  myform = new FormGroup(
    {
      filter : new FormControl('')}
  );
  @ViewChildren(NgbdSortableHeader) headers: QueryList<NgbdSortableHeader>;
  constructor(private ts: MoviesService, pipe: DecimalPipe) {
    this.myform.get('filter').valueChanges.pipe(startWith(null), pairwise())
      .subscribe(([prev, next]: [any, any]) => {
        console.log('PREV2', prev);
        console.log('NEXT2', next);
        this.data = search(next, pipe, this.originalData);
      });
  }

  ngOnInit() {
    this.ts.getData().subscribe(
      (res: Response) => {
        this.originalData = res;
        this.data = res;
        this.collectionSize = this.data.length;
        console.log(this.data);
      }
    );
  }

  get datas() {
    if (this.data && this.data.length > 0) {
      return this.data
        .map((country, i) => ({id: i + 1, ...country}))
        .slice((this.page - 1) * this.pageSize, (this.page - 1) * this.pageSize + this.pageSize);
    }
  }


  onSort({column, direction}: SortEvent) {

    // resetting other headers
    this.headers.forEach(header => {
      if (header.sortable !== column) {
        header.direction = '';
      }
    });

    // sorting countries
    if (direction === '') {
      this.data = this.data;
    } else {
      this.data = [...this.data].sort((a, b) => {
        const res = compare(a[column], b[column]);
        return direction === 'asc' ? res : -res;
      });
    }
  }

}
