import { generateEventTypes, EVENT_TYPE_PLACEHOLDER } from 'seng-event/lib/util/eventTypeUtils';
import AbstractEvent from 'seng-event/lib/AbstractEvent';

class SchedulerEvent extends AbstractEvent {
  public static PLAY_START: string = EVENT_TYPE_PLACEHOLDER;
  public static PLAY_STOP: string = EVENT_TYPE_PLACEHOLDER;

  public clone(): SchedulerEvent {
    return new SchedulerEvent(this.type, this.bubbles, this.cancelable);
  }
}

generateEventTypes({ SchedulerEvent });

export default SchedulerEvent;
