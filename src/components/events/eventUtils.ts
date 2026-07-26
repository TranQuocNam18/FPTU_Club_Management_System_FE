import type { ClubEvent } from '../../types';
import { EventStatusMap } from '../../types';

export function canonicalEventStatus(event: ClubEvent) {
  return EventStatusMap[event.status] ?? String(event.status);
}
