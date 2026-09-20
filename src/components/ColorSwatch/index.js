import styles from './styles.module.css';

export default function ColorSwatch({hex}) {
  return (
    <span className={styles.swatch}>
      <span className={styles.chip} style={{background: hex}} />
      <code>{hex}</code>
    </span>
  );
}
