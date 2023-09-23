import * as React from 'react';
import { fetchConfigs } from 'src/api/configs';
import { getClashAPIConfig, setClashSecret } from 'src/store/app';
import { DispatchFn, State } from 'src/store/types';

import s0 from './APIConfig.module.scss';
import Button from './Button';
import Field from './Field';
import { connect } from './StateProvider';
import SvgYacd from './SvgYacd';

const { useState } = React;
const Ok = 0;

const mapState = (s: State) => ({
  apiConfig: getClashAPIConfig(s),
});

function APIConfig({ dispatch }: { dispatch: DispatchFn }) {
  const [secret, setSecret] = useState('');
  const [errMsg, setErrMsg] = useState('');

  const onConfirm = React.useCallback(() => {
    verify(secret).then((ret) => {
      if (ret[0] !== Ok) {
        setErrMsg(ret[1]);
      } else {
        dispatch(setClashSecret(secret));
      }
    });
  }, [secret, dispatch]);

  const handleContentOnKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (
        e.target instanceof Element &&
        (!e.target.tagName || e.target.tagName.toUpperCase() !== 'INPUT')
      ) {
        return;
      }
      if (e.key !== 'Enter') return;
      onConfirm();
    },
    [onConfirm],
  );

  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div className={s0.root} onKeyDown={handleContentOnKeyDown}>
      <div className={s0.header}>
        <div className={s0.icon}>
          <SvgYacd width={160} height={160} stroke="var(--stroke)" />
        </div>
      </div>
      <div className={s0.body}>
        <div className={s0.hostnamePort}>
          <Field
            id="secret"
            name="secret"
            label="密钥"
            value={secret}
            type="text"
            onChange={(e) => setSecret(e.target.value)}
          />
        </div>
        {errMsg ? <div className={s0.error}>{errMsg}</div> : null}
      </div>
      <div style={{ margin: '20px 0' }}>
        <Button label="提交" onClick={onConfirm} />
      </div>
      <div style={{ height: 20 }} />
    </div>
  );
}

export default connect(mapState)(APIConfig);

async function verify(secret): Promise<[number, string?]> {
  try {
    const res = await fetchConfigs({ secret, baseURL: window.location.origin });
    if (res.status > 399) {
      return [1, res.statusText];
    }
    return [Ok];
  } catch (e) {
    return [1, 'Failed to connect'];
  }
}
