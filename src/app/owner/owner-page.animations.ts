import { animate, style, transition, trigger } from '@angular/animations';

export const ownerRouteAnimation = trigger('ownerRoute', [
  transition('* => *', [
    style({ opacity: 0, transform: 'translateY(10px)' }),
    animate('340ms cubic-bezier(0.22, 1, 0.36, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
  ])
]);

export const ownerPageEnterAnimation = trigger('ownerPageEnter', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(16px)' }),
    animate('520ms 40ms cubic-bezier(0.22, 1, 0.36, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
  ])
]);
