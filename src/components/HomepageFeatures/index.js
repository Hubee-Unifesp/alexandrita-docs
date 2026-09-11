import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

const FeatureList = [
  {
    title: 'Backend',
    to: '/backend/intro',
    description: 'Arquitetura, APIs e decisões técnicas do backend.',
  },
  {
    title: 'Frontend',
    to: '/frontend/intro',
    description: 'Arquitetura, componentes e padrões do frontend.',
  },
  {
    title: 'Infra',
    to: '/infra/intro',
    description: 'Ambientes, deploy, monitoramento e operação.',
  },
  {
    title: 'Regras de Negócio',
    to: '/regras-negocio/intro',
    description: 'Regras de negócio, fluxos e decisões de produto.',
  },
];

function Feature({title, to, description}) {
  return (
    <div className={clsx('col col--3')}>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">
          <Link to={to}>{title}</Link>
        </Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
