import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  jsonParseWithFallback,
  parseResponse,
  replacePropsInFunction,
} from '../../helpers/json';
import PropTypes from 'prop-types';

export type IUsePikachu = {
  code: string | undefined;
  renderCode: string | undefined;
  contents: Record<string, unknown>[] | undefined;
  userInfo: Record<string, string[]>;
  setUserInfo: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
};
export const usePikachu = (
  endpoint: string,
  serviceId: string,
  placementId: string,
  debug: boolean = false,
): IUsePikachu => {
  const [code, setCode] = useState<string | undefined>(undefined);
  const [contents, setContents] = useState<Record<string, unknown>[] | undefined>(
    undefined,
  );
  const [renderCode, setRenderCode] = useState<string | undefined>(undefined);
  const [userInfo, setUserInfo] = useState<Record<string, string[]>>({});

  const fetchComponent = (userInfo: Record<string, string[]>) => {
    axios
      .post(endpoint, {
        service_id: serviceId,
        placement_id: placementId,
        user_info: userInfo,
      })
      .then(({ data }) => {
        if (debug) {
          console.log(data);
        }
        const { code, contents } = parseResponse(data as Record<string, unknown>);

        if (debug) {
          console.log(code);
          console.log(contents);
        }
        setCode(code);
        setContents(contents);

        if (!code || !contents) {
          setRenderCode(undefined);
        } else {
          const contentValues = (contents || []).map((content) =>
            jsonParseWithFallback(content?.values as string),
          );
          const renderCode = replacePropsInFunction({
            code,
            contents: contentValues,
          });
          if (debug) {
            console.log(renderCode);
          }
          setRenderCode(renderCode);
        }
      })
      .catch((error) => console.error(error));
  };

  useEffect(() => {
    fetchComponent(userInfo);
  }, [endpoint, serviceId, placementId, userInfo]);

  return { code, contents, renderCode, userInfo, setUserInfo };
};

usePikachu.PropTypes = {
  endpoint: PropTypes.string.isRequired,
  serviceId: PropTypes.string.isRequired,
  placementId: PropTypes.string.isRequired,
  debug: PropTypes.bool,
};
