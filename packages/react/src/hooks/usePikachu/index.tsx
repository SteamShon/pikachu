import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  jsonParseWithFallback,
  parseResponse,
  replacePropsInFunction,
} from '../../helpers/json';
import PropTypes from 'prop-types';
import { useInView } from 'react-intersection-observer';
import React from 'react';
import { LivePreview, LiveProvider } from 'react-live-runner';
export type UserInfo = {
  userId: string;
  info: Record<string, string[]>;
}
export type IUsePikachu = {
  code: string | undefined;
  renderCode: string | undefined;
  creatives: (Record<string, unknown> & { content?: Record<string, unknown>})[] | undefined;
  userInfo: UserInfo;
  setUserInfo: React.Dispatch<React.SetStateAction<UserInfo>>;
  component: JSX.Element | undefined;
};
export const usePikachu = ({
  endpoint,
  serviceId,
  placementId,
  eventEndpoint,
  eventTopic,
  options,
  debug
}:{
  endpoint: string,
  serviceId: string,
  placementId: string,
  eventEndpoint?: string,
  eventTopic?: string,
  options?: { 
    threshold: number; 
    triggerOnce: boolean; 
    onChange: (inView: boolean, entry: IntersectionObserverEntry) => void
  },
  debug?: boolean,
}): IUsePikachu => {
  const [code, setCode] = useState<string | undefined>(undefined);
  const [creatives, setCreatives] = useState<Record<string, unknown>[] | undefined>(
    undefined,
  );
  const [renderCode, setRenderCode] = useState<string | undefined>(undefined);
  const [userInfo, setUserInfo] = useState<UserInfo>({userId: "", info: {}});
  const [component, setComponent] = useState<JSX.Element | undefined>(undefined);

  const DefaultOptions = {
    threshold: 1,
    triggerOnce: true,
    onChange: (inView: boolean, entry: IntersectionObserverEntry) => {
      if (!inView) return;
      
      entry.target.querySelector(".placement")?.childNodes.forEach((node) => {
        const nodeId = (node as HTMLElement).id;
        if (!nodeId) return;
        if (userInfo.userId.length == 0) return;

        // send impression event
        const payload = { 
          who: userInfo.userId, 
          what: 'impression', 
          which: nodeId,
          when: Date.now(), 
        };
        if (debug) {
          console.log(payload);
        }
        if (eventEndpoint) {
          const topic = eventTopic || "events";
          axios
            .post(`${eventEndpoint}/${topic}/${serviceId}`, payload)
            .then((res) => console.log(res))
            .catch((e) => console.log(e))
        }

        // add click handler on child
        node.addEventListener('click', e => {
          e.stopPropagation();
          
          const payload = { 
            userId: userInfo.userId, 
            event: 'click', 
            creativeId: nodeId,
            timestamp: Date.now(), 
          };

          if (debug) {
            console.log(payload);
          }
          if (eventEndpoint) {
            axios
              .post(`${eventEndpoint}/${serviceId}`, payload)
              .then((res) => console.log(res))
              .catch((e) => console.log(e))
          }
        });
      })
    }
  };
  const { ref } = useInView(options || DefaultOptions);
  
  const fetchComponent = (userInfo: UserInfo) => {
    axios
      .post(endpoint, {
        service_id: serviceId,
        placement_id: placementId,
        user_info: userInfo.info,
      })
      .then(({ data }) => {
        if (debug) {
          console.log(data);
        }
        const { code, creatives } = parseResponse(data as Record<string, unknown>);

        if (debug) {
          console.log(code);
          console.log(creatives);
        }
        setCode(code);
        setCreatives(creatives);

        if (!code || !creatives) {
          setRenderCode(undefined);
        } else {
          const contentValues = (creatives || []).map((creative) => {
            return {
              id: creative.id as string, 
              content: jsonParseWithFallback(creative?.content?.values as string)
            }}
          );

          const renderCode = replacePropsInFunction({
            code,
            creatives: contentValues,
          });
          if (debug) {
            console.log(renderCode);
          }
          setRenderCode(renderCode);
          
          setComponent(
            <div ref={ref}>
              <LiveProvider code={renderCode}>
                <LivePreview />
              </LiveProvider>
            </div>
          );
        }
      })
      .catch((error) => console.error(error));
  };

  useEffect(() => {
    fetchComponent(userInfo);
  }, [endpoint, serviceId, placementId, userInfo]);

  return { code, creatives, renderCode, userInfo, setUserInfo, component };
};

usePikachu.PropTypes = {
  endpoint: PropTypes.string.isRequired,
  serviceId: PropTypes.string.isRequired,
  placementId: PropTypes.string.isRequired,
  eventEndpoint: PropTypes.string,
  options: PropTypes.object,
  debug: PropTypes.bool,
};
