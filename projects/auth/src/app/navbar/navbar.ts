import { Component, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AUTH_URL } from '../config';
import { Breadcrumb } from '../breadcrumb/breadcrumb';
import { AiAssistant } from '../ai-assistant/ai-assistant';

@Component({
  selector: 'app-navbar',
  imports: [RouterLinkActive,RouterOutlet,RouterLink,Breadcrumb,AiAssistant],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})

export class Navbar implements OnInit {
  sidebarCollapsed = false;
  adminOpen = false;
  configOpen = false;
  userMgmtOpen = false;
  otOpen = false;
  visitorOpen = false;
  authUrl = AUTH_URL;

  constructor(private router: Router) {}

  ngOnInit() {
    if (this.isAdminRoute()) {
      this.adminOpen = true;
    }
    if (this.router.url.includes('/administration/configuration')) {
      this.configOpen = true;
    }
    if (this.router.url.includes('/administration/user-management')) {
      this.userMgmtOpen = true;
    }
    if (this.router.url.includes('/administration/configuration/ot-management')) {
      this.otOpen = true;
    }
    if (this.router.url.includes('/administration/configuration/visitor-management')) {
      this.visitorOpen = true;
    }
  }

  toggleSidebar() { this.sidebarCollapsed = !this.sidebarCollapsed; }
  toggleAdmin() { this.adminOpen = !this.adminOpen; }
  toggleConfig() { this.configOpen = !this.configOpen; }
  toggleUserMgmt() { this.userMgmtOpen = !this.userMgmtOpen; }
 toggleOt() { this.otOpen = !this.otOpen; }
 toggleVisitor() { this.visitorOpen = !this.visitorOpen; }


  isAdminRoute(): boolean {
    return this.router.url.includes('/administration');
  }

  handleBreadcrumbPanel(key: string) {
    this.adminOpen = true;
    if (key === 'administration') return;

    if (key === 'user-management') {
      this.userMgmtOpen = true;
      return;
    }

    this.configOpen = true;
    if (key === 'ot-management') this.otOpen = true;
    if (key === 'visitor-management') this.visitorOpen = true;
  }
}