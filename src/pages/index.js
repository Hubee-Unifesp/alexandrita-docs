import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';

import Heading from '@theme/Heading';
import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          {siteConfig.title}
        </Heading>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <p className={styles.heroDescription}>
          Um só lugar para reunir as regras de negócio, decisões técnicas e
          guias de setup do <strong>Hubee</strong> — a plataforma de gestão
          de eventos universitários desenvolvida pelo time — para que
          ninguém precise garimpar informação espalhada em mensagens,
          memória ou código.
        </p>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/boas-praticas-guias/boas-praticas-banco-de-dados">
            Ver documentação
          </Link>
        </div>
      </div>
    </header>
  );
}

function AboutTheName() {
  return (
    <section className={styles.aboutSection}>
      <div className="container">
        <div className="row">
          <div className={clsx('col col--8 col--offset-2', styles.aboutCol)}>
            <Heading as="h2">Por que "Alexandrita"?</Heading>
            <p>
              O nome é uma referência à <strong>Biblioteca de Alexandria</strong>,
              o maior centro de conhecimento do mundo antigo — reunia em um
              só lugar o saber que, de outra forma, estaria espalhado e se
              perderia com o tempo. A ideia aqui é a mesma, em escala bem
              menor: um repositório único para o conhecimento técnico do
              time, em vez de decisões e contexto perdidos em conversas de
              chat ou só na cabeça de quem escreveu o código.
            </p>
            <p>
              "Alexandrita" é o nome deste <em>portal de documentação</em>.
              O produto que ele documenta — a plataforma de eventos em si —
              se chama <strong>Hubee</strong>.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={siteConfig.title}
      description="Documentação do projeto Hubee: regras de negócio, decisões técnicas, guias de setup e boas práticas do time.">
      <HomepageHeader />
      <main>
        <AboutTheName />
        <HomepageFeatures />
      </main>
    </Layout>
  );
}
