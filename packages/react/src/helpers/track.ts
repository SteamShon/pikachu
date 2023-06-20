import axios from 'axios';
import { UserInfo } from '../hooks/usePikachu';

export default function sendImpressions({
  nodes,
  userInfo,
  debug,
  eventEndpoint,
  eventTopic,
  serviceId,
}: {
  nodes: HTMLElement[];
  userInfo: UserInfo;
  debug: boolean | undefined;
  eventEndpoint: string | undefined;
  eventTopic: string | undefined;
  serviceId: string;
}) {
  const impressions = nodes.map((node) => {
    return {
      who: userInfo.userId,
      what: 'impression',
      which: node.id,
      when: Date.now(),
    };
  });
  // send impressions
  if (debug) {
    console.log(impressions);
  }
  if (eventEndpoint && impressions.length > 0) {
    const topic = eventTopic || 'events';
    const url = `${eventEndpoint}/${topic}/${serviceId}`;

    if (debug) {
      console.log(url);
      console.log(impressions);
    }

    axios
      .post(`${url}`, impressions)
      .then((res) => console.log(res))
      .catch((e) => console.log(e));
  }
}

export function registerSendClicksCallback({
  nodes,
  userInfo,
  debug,
  eventEndpoint,
  eventTopic,
  serviceId,
}: {
  nodes: HTMLElement[];
  userInfo: UserInfo;
  debug: boolean | undefined;
  eventEndpoint: string | undefined;
  eventTopic: string | undefined;
  serviceId: string;
}) {
  nodes.forEach((node) => {
    node.addEventListener('click', (e) => {
      e.stopPropagation();

      const payload = [
        {
          who: userInfo.userId,
          what: 'click',
          which: node.id,
          when: Date.now(),
        },
      ];

      if (debug) {
        console.log(payload);
      }
      if (eventEndpoint) {
        const topic = eventTopic || 'events';
        const url = `${eventEndpoint}/${topic}/${serviceId}`;

        if (debug) {
          console.log(url);
          console.log(payload);
        }
        axios
          .post(`${url}`, payload)
          .then((res) => console.log(res))
          .catch((e) => console.log(e));
      }
    });
  });
}
