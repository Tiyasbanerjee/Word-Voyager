import styles from './StartPage.module.css';

export default function StartPage(){
    return(
        <div className={styles.main_box}>
            <div className={styles.settings_box}>
                <div className={styles.docs_holder}>
                    Welcome to Word Voyger
                </div>
                <div className={styles.controls}>

                </div>
            </div>
        </div>
    )
}