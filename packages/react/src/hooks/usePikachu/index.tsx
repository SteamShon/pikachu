import axios from 'axios';
import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import { LivePreview, LiveProvider } from 'react-live-runner';
import { parseResult, replacePropsInFunction } from '../../helpers/json';
import sendImpressions, { registerSendClicksCallback } from '../../helpers/track';
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
    // triggerOnce: true,
    trackVisibility: true,
    delay: 300,
    onChange: (inView: boolean, entry: IntersectionObserverEntry) => {
      if (!inView) return;

      const nodes: HTMLElement[] = [];
      const placements = entry.target.querySelector('.placement');
      placements?.childNodes.forEach((node) => {
        const nodeId = (node as HTMLElement).id;
        if (!nodeId) return;
        if (userInfo.userId.length == 0) return;

        nodes.push(node as HTMLElement);
      });

      sendImpressions({
        nodes,
        userInfo,
        debug,
        eventEndpoint,
        eventTopic,
        serviceId,
      });
      registerSendClicksCallback({
        nodes,
        userInfo,
        debug,
        eventEndpoint,
        eventTopic,
        serviceId,
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
        let { parsedCode, contentValues, contents, creatives } = parseResult({
          useAdSet,
          data,
        });

        setCode(parsedCode);
        setContents(contents);
        setCreatives(creatives);

        if (debug) {
          console.log(parsedCode);
          console.log(contentValues);
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
