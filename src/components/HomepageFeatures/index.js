import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

const FeatureList = [
  {
    title: 'Primeiros Passos',
    to: '/primeiros-passos/intro',
    description:
      'O que você precisa fazer para começar a desenvolver no Hubee.',
  },
  {
    title: 'Boas Práticas e Guias',
    to: '/boas-praticas-guias/boas-praticas-banco-de-dados',
    description:
      'Guias práticos consolidados pelo time — o primeiro lugar para procurar antes de perguntar no chat.',
  },
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
  {
    title: 'Spikes',
    to: '/spikes/intro',
    description: 'Resultados de spikes técnicos e sessões de estudo do time.',
  },
];

function Feature({title, to, description}) {
  return (
    <div className={clsx('col col--4', styles.featureCol)}>
      <Link to={to} className={styles.featureCard}>
        <Heading as="h3" className={styles.featureTitle}>
          {title}
        </Heading>
        <p>{description}</p>
      </Link>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <Heading as="h2" className={styles.sectionTitle}>
          O que você encontra aqui
        </Heading>
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
