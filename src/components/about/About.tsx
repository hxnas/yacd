import { useQuery } from '@tanstack/react-query';
import * as React from 'react';
import { GitHub } from 'react-feather';
import { fetchVersion } from 'src/api/version';
import ContentHeader from 'src/components/ContentHeader';
import { connect } from 'src/components/StateProvider';
import { getClashAPIConfig } from 'src/store/app';
import { ClashAPIConfig } from 'src/types';

import { State } from '$src/store/types';

import s from './About.module.scss';

type Props = { apiConfig: ClashAPIConfig };

function Version({ name, link, version }: { name: string; link: string; version?: string }) {
  return (
    <div className={s.root}>
      <h2>{name}</h2>
      {version ? (
        <p>
          <span>Version </span>
          <span className={s.mono}>{version}</span>
        </p>
      ) : (
        <></>
      )}
      <p>
        <a className={s.link} href={link} target="_blank" rel="noopener noreferrer">
          <GitHub size={20} />
          <span>Source</span>
        </a>
      </p>
    </div>
  );
}

function AboutImpl(props: Props) {
  const { data: version } = useQuery(['/version', props.apiConfig], () =>
    fetchVersion('/version', props.apiConfig),
  );

  const sVer = __VERSION__ + '-single-node';
  return (
    <>
      <ContentHeader title="About" />
      <Version name="Clash" version={version?.version} link="https://github.com/Dreamacro/clash" />
      <Version name="Yacd" version={__VERSION__} link="https://github.com/haishanh/yacd" />
      <Version name="Yacd(single_node)" version={sVer} link="https://github.com/hxnas/yacd" />
    </>
  );
}

const mapState = (s: State) => ({
  apiConfig: getClashAPIConfig(s),
});

export const About = connect(mapState)(AboutImpl);
