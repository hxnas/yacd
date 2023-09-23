import * as React from 'react';
import { useTranslation } from 'react-i18next';
import * as logsApi from 'src/api/logs';
import Select from 'src/components/shared/Select';
import { ClashGeneralConfig, DispatchFn, State } from 'src/store/types';
import { ClashAPIConfig } from 'src/types';

import { getClashAPIConfig, getLatencyTestUrl, getSelectedChartStyleIndex } from '../store/app';
import { fetchConfigs, getConfigs, updateConfigs } from '../store/configs';
import s0 from './Config.module.scss';
import ContentHeader from './ContentHeader';
import Input, { SelfControlledInput } from './Input';
import { Selection2 } from './Selection';
import { connect, useStoreActions } from './StateProvider';
import Switch from './SwitchThemed';
import TrafficChartSample from './TrafficChartSample';
// import ToggleSwitch from './ToggleSwitch';

const { useEffect, useState, useCallback, useRef, useMemo } = React;

const propsList = [{ id: 0 }, { id: 1 }, { id: 2 }, { id: 3 }];

const logLevelOptions = [
  ['debug', 'Debug'],
  ['info', 'Info'],
  ['warning', 'Warning'],
  ['error', 'Error'],
  ['silent', 'Silent'],
];

const langOptions = [
  ['zh', '中文'],
  ['en', 'English'],
];

const mapState = (s: State) => ({
  configs: getConfigs(s),
  apiConfig: getClashAPIConfig(s),
});

const mapState2 = (s: State) => ({
  selectedChartStyleIndex: getSelectedChartStyleIndex(s),
  latencyTestUrl: getLatencyTestUrl(s),
  apiConfig: getClashAPIConfig(s),
});

const Config = connect(mapState2)(ConfigImpl);
export default connect(mapState)(ConfigContainer);

function ConfigContainer({
  dispatch,
  configs,
  apiConfig,
}: {
  dispatch: DispatchFn;
  configs: ClashGeneralConfig;
  apiConfig: ClashAPIConfig;
}) {
  useEffect(() => {
    dispatch(fetchConfigs(apiConfig));
  }, [dispatch, apiConfig]);
  return <Config configs={configs} />;
}

type ConfigImplProps = {
  dispatch: DispatchFn;
  configs: ClashGeneralConfig;
  selectedChartStyleIndex: number;
  latencyTestUrl: string;
  apiConfig: ClashAPIConfig;
};

function ConfigImpl({
  dispatch,
  configs,
  selectedChartStyleIndex,
  latencyTestUrl,
  apiConfig,
}: ConfigImplProps) {
  const [configState, setConfigStateInternal] = useState(configs);
  const refConfigs = useRef(configs);
  useEffect(() => {
    if (refConfigs.current !== configs) {
      setConfigStateInternal(configs);
    }
    refConfigs.current = configs;
  }, [configs]);

  const setConfigState = useCallback(
    (name: keyof ClashGeneralConfig, val: ClashGeneralConfig[keyof ClashGeneralConfig]) => {
      setConfigStateInternal({ ...configState, [name]: val });
    },
    [configState],
  );

  const handleSwitchOnChange = useCallback(
    (checked: boolean) => {
      const name = 'allow-lan';
      const value = checked;
      setConfigState(name, value);
      dispatch(updateConfigs(apiConfig, { 'allow-lan': value }));
    },
    [apiConfig, dispatch, setConfigState],
  );

  const handleChangeValue = useCallback(
    ({ name, value }) => {
      switch (name) {
        case 'mode':
        case 'log-level':
          setConfigState(name, value);
          dispatch(updateConfigs(apiConfig, { [name]: value }));
          if (name === 'log-level') {
            logsApi.reconnect({ ...apiConfig, logLevel: value });
          }
          break;
        case 'redir-port':
        case 'socks-port':
        case 'mixed-port':
        case 'port':
          if (value !== '') {
            const num = parseInt(value, 10);
            if (num < 0 || num > 65535) return;
          }
          setConfigState(name, value);
          break;
        default:
          return;
      }
    },
    [apiConfig, dispatch, setConfigState],
  );

  const handleInputOnChange = useCallback<React.ChangeEventHandler<HTMLInputElement>>(
    (e) => handleChangeValue(e.target),
    [handleChangeValue],
  );

  const { selectChartStyleIndex, updateAppConfig } = useStoreActions();

  const handleInputOnBlur = useCallback<React.FocusEventHandler<HTMLInputElement>>(
    (e) => {
      const target = e.target;
      const { name, value } = target;
      switch (name) {
        case 'port':
        case 'socks-port':
        case 'mixed-port':
        case 'redir-port': {
          const num = parseInt(value, 10);
          if (num < 0 || num > 65535) return;
          dispatch(updateConfigs(apiConfig, { [name]: num }));
          break;
        }
        case 'latencyTestUrl': {
          updateAppConfig(name, value);
          break;
        }
        default:
          throw new Error(`unknown input name ${name}`);
      }
    },
    [apiConfig, dispatch, updateAppConfig],
  );

  const mode = useMemo(() => {
    const m = configState.mode;
    return typeof m === 'string' && m[0].toUpperCase() + m.slice(1);
  }, [configState.mode]);

  const { t, i18n } = useTranslation();

  const modeOptions = [
    ['Global', t('proxy_mode_global')],
    ['Rule', t('proxy_mode_rule')],
    ['Direct', t('proxy_mode_direct')],
  ];

  const portFields = [
    { key: 'port', label: t('http_proxy_port') },
    { key: 'socks-port', label: t('socks5_proxy_port') },
    { key: 'mixed-port', label: t('mixed_proxy_port') },
    { key: 'redir-port', label: t('redir_proxy_port') },
  ];

  return (
    <div>
      <ContentHeader title={t('Config')} />
      <div className={s0.root}>
        {portFields.map((f) =>
          configState[f.key] !== undefined ? (
            <div key={f.key}>
              <div className={s0.label}>{f.label}</div>
              <Input
                name={f.key}
                value={configState[f.key]}
                onChange={handleInputOnChange}
                onBlur={handleInputOnBlur}
              />
            </div>
          ) : null,
        )}

        <div>
          <div className={s0.label}>{t('proxy_mode')}</div>
          <Select
            options={modeOptions}
            selected={mode}
            onChange={(e) => handleChangeValue({ name: 'mode', value: e.target.value })}
          />
        </div>

        <div>
          <div className={s0.label}>{t('log_level')}</div>
          <Select
            options={logLevelOptions}
            selected={configState['log-level']}
            onChange={(e) => handleChangeValue({ name: 'log-level', value: e.target.value })}
          />
        </div>

        <div>
          <div className={s0.label}>{t('allow_lan')}</div>
          <div className={s0.wrapSwitch}>
            <Switch
              name="allow-lan"
              checked={configState['allow-lan']}
              onChange={handleSwitchOnChange}
            />
          </div>
        </div>
      </div>

      <div className={s0.sep}>
        <div />
      </div>

      <div className={s0.section}>
        <div>
          <div className={s0.label}>{t('latency_test_url')}</div>
          <SelfControlledInput
            name="latencyTestUrl"
            type="text"
            value={latencyTestUrl}
            onBlur={handleInputOnBlur}
          />
        </div>
        <div>
          <div className={s0.label}>{t('lang')}</div>
          <div>
            <Select
              options={langOptions}
              selected={i18n.language}
              onChange={(e) => i18n.changeLanguage(e.target.value)}
            />
          </div>
        </div>

        <div style={{ gridColumnStart: 1, gridColumnEnd: 3 }}>
          <div className={s0.label}>{t('chart_style')}</div>
          <Selection2
            OptionComponent={TrafficChartSample}
            optionPropsList={propsList}
            selectedIndex={selectedChartStyleIndex}
            onChange={selectChartStyleIndex}
          />
        </div>

        <div></div>
      </div>
    </div>
  );
}
