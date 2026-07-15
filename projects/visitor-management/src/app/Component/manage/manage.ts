import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VisitorPermitManage } from './visitor-permit/visitor-permit';
import { MaterialPermitManage } from './material-permit/material-permit';
import { ExitPermitManage } from './exit-permit/exit-permit';

@Component({
  selector: 'app-manage',
  imports: [CommonModule, VisitorPermitManage, MaterialPermitManage, ExitPermitManage],
  templateUrl: './manage.html',
  styleUrl: './manage.scss',
})
export class Manage {
  tabs = [
    { key: 'visitor', label: 'Manage Visitor Permit' },
    { key: 'material', label: 'Manage Material Permit' },
    { key: 'exit', label: 'Manage Exit Permit' },
  ];
  activeTab = this.tabs[0].key;

  selectTab(key: string) {
    this.activeTab = key;
  }
}
