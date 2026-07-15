import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-edit-report',
  imports: [CommonModule],
  templateUrl: './edit-report.html',
  styleUrl: './edit-report.scss',
})
export class EditReport {
  readonly reportId: string | null;

  constructor(
    route: ActivatedRoute,
    private router: Router,
  ) {
    this.reportId = route.snapshot.paramMap.get('id');
  }

  back() {
    this.router.navigate(['/report']);
  }
}
