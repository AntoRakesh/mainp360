import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AssistantReply {
  text: string;
  navigate?: { route: string; queryParams?: Record<string, string> };
}

interface SearchDomain {
  keywords: string[];
  label: string;
  route: string;
  apiUrl: string;
  matchFields: string[];
  displayName: (item: any) => string;
  extraQueryParams?: Record<string, string>;
}

interface NavTarget {
  keywords: string[];
  label: string;
  route: string;
}

const STOPWORDS = new Set([
  'is', 'are', 'the', 'a', 'an', 'present', 'in', 'not', 'exist', 'exists',
  'find', 'search', 'for', 'of', 'to', 'does', 'do', 'we', 'have', 'has',
  'there', 'check', 'look', 'looking', 'show', 'me', 'please', 'go', 'goto',
  'open', 'with', 'and', 'any', 'all', 'about', 'named', 'called', 'name',
  'my', 'i', 'want', 'can', 'you', 'it', '?',
]);

const SEARCH_INTENT_WORDS = [
  'is', 'present', 'exist', 'exists', 'find', 'search', 'check', 'there',
  'have', 'has', 'look', 'does', 'search for', 'looking for',
];

@Injectable({ providedIn: 'root' })
export class AiAssistantService {
  private searchDomains: SearchDomain[] = [
    {
      keywords: ['device', 'devices'],
      label: 'Device',
      route: '/administration/configuration/device',
      apiUrl: `${environment.deviceApiUrl}/devices`,
      matchFields: ['uniqueId', 'modelId', 'type', 'mydeviceName', 'projectName', 'buildingName'],
      displayName: (d) => d.mydeviceName || d.uniqueId || d.modelId || 'device',
    },
    {
      keywords: ['employee', 'employees', 'staff'],
      label: 'Employee',
      route: '/administration/configuration/people',
      apiUrl: `${environment.peopleApiUrl}/employees`,
      matchFields: ['firstname', 'lastname', 'idNumber', 'cardBadgeNumber', 'nationalId'],
      displayName: (e) => `${e.firstname ?? ''} ${e.lastname ?? ''}`.trim() || 'employee',
      extraQueryParams: { tab: 'employees' },
    },
    {
      keywords: ['visitor', 'visitors', 'guest', 'guests'],
      label: 'Visitor',
      route: '/administration/configuration/people',
      apiUrl: `${environment.peopleApiUrl}/visitors`,
      matchFields: ['firstname', 'lastname', 'idNumber', 'cardBadgeNumber', 'nationalId'],
      displayName: (v) => `${v.firstname ?? ''} ${v.lastname ?? ''}`.trim() || 'visitor',
      extraQueryParams: { tab: 'visitors' },
    },
    {
      keywords: ['contractor', 'contractors'],
      label: 'Contractor',
      route: '/administration/configuration/people',
      apiUrl: `${environment.peopleApiUrl}/contractors`,
      matchFields: ['contractorName', 'contractorId', 'companyName', 'referenceId'],
      displayName: (c) => c.contractorName || 'contractor',
      extraQueryParams: { tab: 'contractors' },
    },
    {
      keywords: ['user', 'users', 'login account'],
      label: 'User',
      route: '/administration/user-management/user',
      apiUrl: `${environment.userMgmtApiUrl}/users`,
      matchFields: ['userName', 'shortName', 'email', 'contactNo'],
      displayName: (u) => u.userName || u.shortName || u.email || 'user',
    },
  ];

  private navTargets: NavTarget[] = [
    { keywords: ['dashboard'], label: 'Dashboard', route: '/dashboard' },
    { keywords: ['locating', 'location', 'tracking'], label: 'Locating', route: '/locating' },
    { keywords: ['events', 'event'], label: 'Events', route: '/events' },
    { keywords: ['reports', 'report'], label: 'Report', route: '/report' },
    { keywords: ['process automation', 'automation'], label: 'Process & Automation', route: '/process-automation' },
    { keywords: ['license', 'licenses'], label: 'License', route: '/administration/license' },
    { keywords: ['role', 'roles'], label: 'Role', route: '/administration/user-management/role' },
    { keywords: ['project', 'projects'], label: 'Project', route: '/administration/configuration/project' },
    { keywords: ['attendance'], label: 'Attendance', route: '/administration/configuration/attendance' },
    { keywords: ['access control', 'access-control', 'access'], label: 'Access Control', route: '/administration/configuration/access-control' },
    { keywords: ['ot management', 'ot-management', 'operation theatre', 'operation theater'], label: 'OT Management', route: '/administration/configuration/ot-management' },
    { keywords: ['visitor management', 'visitor-management', 'permit', 'permits'], label: 'Visitor Management', route: '/administration/configuration/visitor-management/manage' },
    { keywords: ['patrol'], label: 'Patrol', route: '/administration/configuration/patrol' },
    { keywords: ['meal management', 'meal-management', 'meal'], label: 'Meal Management', route: '/administration/configuration/meal-management' },
    { keywords: ['evacuation'], label: 'Evacuation', route: '/administration/configuration/evacuation' },
  ];

  constructor(private http: HttpClient) {}

  process(rawInput: string): Observable<AssistantReply> {
    const input = rawInput.trim();
    if (!input) return of({ text: "I didn't catch that. Please type or say something." });

    const lower = input.toLowerCase();

    const domain = this.searchDomains.find(d => d.keywords.some(k => lower.includes(k)));
    if (domain) {
      const looksLikeSearch = SEARCH_INTENT_WORDS.some(w => lower.includes(w));
      const term = looksLikeSearch ? this.extractTerm(lower, domain.keywords) : null;

      if (term) {
        return this.runSearch(domain, term);
      }

      return of({
        text: `Opening ${domain.label} management...`,
        navigate: { route: domain.route, queryParams: domain.extraQueryParams },
      });
    }

    const navTarget = this.navTargets.find(t => t.keywords.some(k => lower.includes(k)));
    if (navTarget) {
      return of({
        text: `Opening ${navTarget.label}...`,
        navigate: { route: navTarget.route },
      });
    }

    return of({
      text: `Sorry, I couldn't understand "${input}". Try asking about devices, employees, visitors, contractors, or users, or say a page name like "reports" or "attendance".`,
    });
  }

  private extractTerm(lower: string, domainKeywords: string[]): string | null {
    const tokens = lower
      .split(/[^a-z0-9]+/i)
      .filter(Boolean)
      .filter(tok => !STOPWORDS.has(tok))
      .filter(tok => !domainKeywords.includes(tok));

    return tokens.length ? tokens.join(' ') : null;
  }

  private runSearch(domain: SearchDomain, term: string): Observable<AssistantReply> {
    const t = term.toLowerCase();
    return this.http.get<any[]>(domain.apiUrl).pipe(
      map(list => {
        const match = (list || []).find(item =>
          domain.matchFields.some(f => (item?.[f] ?? '').toString().toLowerCase().includes(t))
        );

        const queryParams = { ...(domain.extraQueryParams ?? {}), q: term };

        if (match) {
          const name = domain.displayName(match);
          return {
            text: `Yes, ${domain.label.toLowerCase()} "${name}" is present. Opening ${domain.label} management...`,
            navigate: { route: domain.route, queryParams },
          };
        }

        return {
          text: `No, I couldn't find a ${domain.label.toLowerCase()} matching "${term}".`,
          navigate: { route: domain.route, queryParams },
        };
      }),
      catchError(() => of({
        text: `Sorry, I couldn't reach the ${domain.label} service right now. Please try again later.`,
      }))
    );
  }
}
