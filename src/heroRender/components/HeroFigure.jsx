import React, { useCallback } from "react";
import styles from '../HeroFigure.module.css';
import FemaleHair from "./femaleHair";
import MaleHair from "./maleHair";
import FemaleBody from "./femaleBody";
import MaleBody from "./maleBody";
import FemaleArms from "./femaleArms";
import MaleArms from "./maleArms";
import FemaleLegs from "./femaleLegs";
import MaleLegs from "./maleLegs";
import FemaleFeet from "./femaleFeet";
import MaleFeet from "./maleFeet";
import { HeadAppendage } from "./headAppendage";
import { BackAppendage } from "./backAppendage";
import HeroEyes from "./Eyes";

import FemaleHeadHighlight from "../assets/images/hero/female/Head-highlight.svg";
import FemaleHeadShadow from "../assets/images/hero/female/Head-shadow.svg";
import femaleSeerHead from '../assets/images/hero/female/clothes/seer-HeadPiece.svg';
import MaleHeadHighlight from "../assets/images/hero/male/Head-highlight.svg";
import MaleHeadShadow from "../assets/images/hero/male/Head-shadow.svg";
import maleSeerHead from '../assets/images/hero/male/clothes/seer-HeadPiece.svg';

const HeadFemale = ({ stroke }) => (
  <React.Fragment>
    <img src={FemaleHeadHighlight} className={styles.highlight} alt="" />
    <img src={FemaleHeadShadow} className={styles.shadow} alt="" />
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 -0.5 30 45"
      shapeRendering="crispEdges"
      className={styles.color}
    >
      <path
        stroke={stroke}
        d="M13 11h4M12 12h6M11 13h8M11 14h8M11 15h8M11 16h8M11 17h8M11 18h7M12 19h6M13 20h4"
      />
    </svg>
  </React.Fragment>
);

const HeadMale = ({ stroke }) => (
  <React.Fragment>
    <img src={MaleHeadHighlight} className={styles.highlight} alt="" />
    <img src={MaleHeadShadow} className={styles.shadow} alt="" />
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 -0.5 30 45"
      shapeRendering="crispEdges"
      className="current"
    >
      <path
        stroke={stroke}
        d="M13 10h5M12 11h7M11 12h9M11 13h9M11 14h9M11 15h9M11 16h9M11 17h8M12 18h6M13 19h4"
      />
    </svg>
  </React.Fragment>
);

const HeroFigure = ({ gender, class: heroClass, background, visualGenes }) => {
  return (
    <div
      className={`${styles.heroFrame} ${styles[background]} ${styles[heroClass]} ${styles[gender]}`}
    >
      <div className={styles.heroContainer}>
        <div className={styles.heroHeadContainer}>
          {gender === "female" && (
            <>
              <FemaleHair
                hairId={visualGenes.hairStyle}
                hairColor={visualGenes.hairColor}
              />
              {heroClass === 'seer' && (
                <div className={styles.heroHeadPiece}>
                  <img src={femaleSeerHead} className={styles.clothing} alt="" />
                </div>
              )}
            </>
          )}

          {gender === "male" && (
            <>
              <MaleHair
                hairId={visualGenes.hairStyle}
                hairColor={visualGenes.hairColor}
              />
              {heroClass === 'seer' && (
                <div className={styles.heroHeadPiece}>
                  <img src={maleSeerHead} className={styles.clothing} alt="" />
                </div>
              )}
            </>
          )}

          <div className={styles.heroEyes}>
            <HeroEyes eyeColor={visualGenes.eyeColor} />
          </div>
          <div className={`${styles.heroHead} ${styles.bodyPart}`}>
            {gender === "female" && (
              <HeadFemale stroke={`#${visualGenes.skinColor}`} />
            )}
            {gender === "male" && (
              <HeadMale stroke={`#${visualGenes.skinColor}`} />
            )}
          </div>
          <HeadAppendage
            headId={visualGenes.headAppendage}
            stroke={`#${visualGenes.appendageColor}`}
          />
        </div>

        {gender === "female" && (
          <FemaleBody
            stroke={`#${visualGenes.skinColor}`}
            mainClass={heroClass}
          />
        )}
        {gender === "male" && (
          <MaleBody
            stroke={`#${visualGenes.skinColor}`}
            mainClass={heroClass}
          />
        )}

        {gender === "female" && (
          <FemaleArms
            stroke={`#${visualGenes.skinColor}`}
            mainClass={heroClass}
          />
        )}
        {gender === "male" && (
          <MaleArms
            stroke={`#${visualGenes.skinColor}`}
            mainClass={heroClass}
          />
        )}

        {gender === "female" && (
          <FemaleLegs
            stroke={`#${visualGenes.skinColor}`}
            mainClass={heroClass}
          />
        )}
        {gender === "male" && (
          <MaleLegs
            stroke={`#${visualGenes.skinColor}`}
            mainClass={heroClass}
          />
        )}

        {gender === "female" && (
          <FemaleFeet
            stroke={`#${visualGenes.skinColor}`}
            mainClass={heroClass}
          />
        )}
        {gender === "male" && (
          <MaleFeet
            stroke={`#${visualGenes.skinColor}`}
            mainClass={heroClass}
          />
        )}

        <BackAppendage
          backId={visualGenes.backAppendage}
          stroke={`#${visualGenes.backAppendageColor}`}
        />
      </div>
    </div>
  );
};

export default React.memo(HeroFigure);
