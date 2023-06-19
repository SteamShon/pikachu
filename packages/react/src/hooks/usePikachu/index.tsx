import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  jsonParseWithFallback,
  parseAdSetResponse,
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
};
export type IUsePikachu = {
  code: string | undefined;
  renderCode: string | undefined;
  creatives:
    | (Record<string, unknown> & { content?: Record<string, unknown> })[]
    | undefined;
  contents: Record<string, unknown>[] | undefined;
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
  useAdSet,
  debug,
}: {
  endpoint: string;
  serviceId: string;
  placementId: string;
  eventEndpoint?: string;
  eventTopic?: string;
  options?: {
    threshold: number;
    triggerOnce: boolean;
    onChange: (inView: boolean, entry: IntersectionObserverEntry) => void;
  };
  useAdSet?: boolean;
  debug?: boolean;
}): IUsePikachu => {
  const [code, setCode] = useState<string | undefined>(undefined);
  const [creatives, setCreatives] = useState<Record<string, unknown>[] | undefined>(
    undefined,
  );
  const [contents, setContents] = useState<Record<string, unknown>[] | undefined>(
    undefined,
  );
  const [renderCode, setRenderCode] = useState<string | undefined>(undefined);
  const [userInfo, setUserInfo] = useState<UserInfo>({ userId: '', info: {} });
  const [component, setComponent] = useState<JSX.Element | undefined>(undefined);

  const DefaultOptions = {
    threshold: 1,
    triggerOnce: true,
    onChange: (inView: boolean, entry: IntersectionObserverEntry) => {
      if (!inView) return;

      const nodes: HTMLElement[] = [];
      entry.target.querySelector('.placement')?.childNodes.forEach((node) => {
        const nodeId = (node as HTMLElement).id;
        if (!nodeId) return;
        if (userInfo.userId.length == 0) return;

        nodes.push(node as HTMLElement);
      });
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
      if (eventEndpoint) {
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
    },
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
        let contentValues;
        let parsedCode;
        if (useAdSet) {
          const { code, contents } = parseAdSetResponse(
            data as Record<string, unknown>,
          );
          parsedCode = code;
          contentValues = contents?.map((content) => {
            return {
              id: content.id as string,
              content: jsonParseWithFallback(content?.values as string),
            };
          });
          if (debug) {
            console.log(code);
            console.log(contents);
          }
          setCode(code);
          setContents(contents);
        } else {
          const { code, creatives } = parseResponse(data as Record<string, unknown>);
          parsedCode = code;
          contentValues = creatives?.map((creative) => {
            return {
              id: creative.id as string,
              content: jsonParseWithFallback(creative?.content?.values as string),
            };
          });
          if (debug) {
            console.log(code);
            console.log(creatives);
          }
          setCode(code);
          setCreatives(creatives);
        }

        if (!parsedCode || !contentValues) {
          setRenderCode(undefined);
        } else {
          const renderCode = replacePropsInFunction({
            code: parsedCode,
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
            </div>,
          );
        }
      })
      .catch((error) => console.error(error));
  };

  useEffect(() => {
    fetchComponent(userInfo);
  }, [endpoint, serviceId, placementId, userInfo]);

  return { code, creatives, contents, renderCode, userInfo, setUserInfo, component };
};

usePikachu.PropTypes = {
  endpoint: PropTypes.string.isRequired,
  serviceId: PropTypes.string.isRequired,
  placementId: PropTypes.string.isRequired,
  eventEndpoint: PropTypes.string,
  options: PropTypes.object,
  debug: PropTypes.bool,
};
