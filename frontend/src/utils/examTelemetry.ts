type TelemetryEvent = {
  ts: number;
  type: string;
  details?: Record<string, any>;
};

const STORAGE_KEY = 'exam_telemetry_events_v1';

function readEvents(): TelemetryEvent[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY) || '[]';
    return JSON.parse(raw) as TelemetryEvent[];
  } catch (e) {
    return [];
  }
}

function writeEvents(events: TelemetryEvent[]) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  } catch (e) {
    // ignore
  }
}

export function recordEvent(type: string, details?: Record<string, any>) {
  const events = readEvents();
  const ev: TelemetryEvent = { ts: Date.now(), type, details };
  events.push(ev);
  // keep last 200 events
  if (events.length > 200) events.splice(0, events.length - 200);
  writeEvents(events);
  // also log to console for real-time debugging
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.debug('[examTelemetry] recorded', ev);
  }
}

export function getEvents(): TelemetryEvent[] {
  return readEvents();
}

export function clearEvents() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch (e) {}
}

export function downloadEvents() {
  const events = readEvents();
  const blob = new Blob([JSON.stringify(events, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `exam-telemetry-${new Date().toISOString()}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
