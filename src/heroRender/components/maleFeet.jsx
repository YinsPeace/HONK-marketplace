import React from "react"; // useState
import styles from '../HeroFigure.module.css';

import MaleLeftFootHighlight from "../assets/images/hero/male/LeftFoot-highlight.svg";
import MaleLeftFootShadow from "../assets/images/hero/male/LeftFoot-shadow.svg";
import MaleRightFootHighlight from "../assets/images/hero/male/RightFoot-highlight.svg";
import MaleRightFootShadow from "../assets/images/hero/male/RightFoot-shadow.svg";

import archerLeftFoot from "../assets/images/hero/male/clothes/archer-LeftFoot.svg";
import archerRightFoot from "../assets/images/hero/male/clothes/archer-RightFoot.svg";

import berserkerLeftFoot from "../assets/images/hero/male/clothes/berserker-LeftFoot.svg";
import berserkerRightFoot from "../assets/images/hero/male/clothes/berserker-RightFoot.svg";

import knightLeftFoot from "../assets/images/hero/male/clothes/knight-LeftFoot.svg";
import knightRightFoot from "../assets/images/hero/male/clothes/knight-RightFoot.svg";

import legionnaireLeftFoot from "../assets/images/hero/male/clothes/legionnaire-LeftFoot.svg";
import legionnaireRightFoot from "../assets/images/hero/male/clothes/legionnaire-RightFoot.svg";

import monkLeftFoot from "../assets/images/hero/male/clothes/monk-LeftFoot.svg";
import monkRightFoot from "../assets/images/hero/male/clothes/monk-RightFoot.svg";

import pirateLeftFoot from "../assets/images/hero/male/clothes/pirate-LeftFoot.svg";
import pirateRightFoot from "../assets/images/hero/male/clothes/pirate-RightFoot.svg";

import priestLeftFoot from "../assets/images/hero/male/clothes/priest-LeftFoot.svg";
import priestRightFoot from "../assets/images/hero/male/clothes/priest-RightFoot.svg";

import scholarLeftFoot from "../assets/images/hero/male/clothes/scholar-LeftFoot.svg";
import scholarRightFoot from "../assets/images/hero/male/clothes/scholar-RightFoot.svg";

import seerLeftFoot from "../assets/images/hero/male/clothes/seer-LeftFoot.svg";
import seerRightFoot from "../assets/images/hero/male/clothes/seer-RightFoot.svg";

import thiefLeftFoot from "../assets/images/hero/male/clothes/thief-LeftFoot.svg";
import thiefRightFoot from "../assets/images/hero/male/clothes/thief-RightFoot.svg";

import warriorLeftFoot from "../assets/images/hero/male/clothes/warrior-LeftFoot.svg";
import warriorRightFoot from "../assets/images/hero/male/clothes/warrior-RightFoot.svg";

import wizardLeftFoot from "../assets/images/hero/male/clothes/wizard-LeftFoot.svg";
import wizardRightFoot from "../assets/images/hero/male/clothes/wizard-RightFoot.svg";

/* ADVANCED HEROES */
import paladinLeftFoot from "../assets/images/hero/male/clothes/advanced/paladin-LeftFoot.svg";
import paladinRightFoot from "../assets/images/hero/male/clothes/advanced/paladin-RightFoot.svg";
import darkKnightLeftFoot from "../assets/images/hero/male/clothes/advanced/darkKnight-LeftFoot.svg";
import darkKnightRightFoot from "../assets/images/hero/male/clothes/advanced/darkKnight-RightFoot.svg";
import summonerLeftFoot from "../assets/images/hero/male/clothes/advanced/summoner-LeftFoot.svg";
import summonerRightFoot from "../assets/images/hero/male/clothes/advanced/summoner-RightFoot.svg";
import ninjaLeftFoot from "../assets/images/hero/male/clothes/advanced/ninja-LeftFoot.svg";
import ninjaRightFoot from "../assets/images/hero/male/clothes/advanced/ninja-RightFoot.svg";
import shapeshifterLeftFoot from "../assets/images/hero/male/clothes/advanced/shapeshifter-LeftFoot.svg";
import shapeshifterRightFoot from "../assets/images/hero/male/clothes/advanced/shapeshifter-RightFoot.svg";
import bardLeftFoot from "../assets/images/hero/male/clothes/advanced/bard-LeftFoot.svg";
import bardRightFoot from "../assets/images/hero/male/clothes/advanced/bard-RightFoot.svg";

/* ELITE HEROES */
import dragoonLeftFoot from "../assets/images/hero/male/clothes/elite/dragoon-LeftFoot.svg";
import dragoonRightFoot from "../assets/images/hero/male/clothes/elite/dragoon-RightFoot.svg";
import sageLeftFoot from "../assets/images/hero/male/clothes/elite/sage-LeftFoot.svg";
import sageRightFoot from "../assets/images/hero/male/clothes/elite/sage-RightFoot.svg";
import spellBowLeftFoot from "../assets/images/hero/male/clothes/elite/spellbow-LeftFoot.svg";
import spellBowRightFoot from "../assets/images/hero/male/clothes/elite/spellbow-RightFoot.svg";

/* LEGENDARY HEROES */
import dreadKnightLeftFoot from "../assets/images/hero/male/clothes/legendary/dreadknight-LeftFoot.svg";
import dreadKnightRightFoot from "../assets/images/hero/male/clothes/legendary/dreadknight-RightFoot.svg";


const getClassInfo = (mainClass) => {
	switch (mainClass) {
		case "archer": {
			return {
				leftFoot: archerLeftFoot,
				rightFoot: archerRightFoot,
			};
		}
		case "berserker": {
			return {
				leftFoot: berserkerLeftFoot,
				rightFoot: berserkerRightFoot,
			};
		}
		case "knight": {
			return {
				leftFoot: knightLeftFoot,
				rightFoot: knightRightFoot,
			};
		}
		case "legionnaire": {
			return {
				leftFoot: legionnaireLeftFoot,
				rightFoot: legionnaireRightFoot,
			};
		}
		case "monk": {
			return {
				leftFoot: monkLeftFoot,
				rightFoot: monkRightFoot,
			};
		}
		case "pirate": {
			return {
				leftFoot: pirateLeftFoot,
				rightFoot: pirateRightFoot,
			};
		}
		case "priest": {
			return {
				leftFoot: priestLeftFoot,
				rightFoot: priestRightFoot,
			};
		}
		case "scholar": {
			return {
				leftFoot: scholarLeftFoot,
				rightFoot: scholarRightFoot,
			};
		}
		case "seer": {
			return {
				leftFoot: seerLeftFoot,
				rightFoot: seerRightFoot,
			};
		}
		case "thief": {
			return {
				leftFoot: thiefLeftFoot,
				rightFoot: thiefRightFoot,
			};
		}
		case "warrior": {
			return {
				leftFoot: warriorLeftFoot,
				rightFoot: warriorRightFoot,
			};
		}
		case "wizard": {
			return {
				leftFoot: wizardLeftFoot,
				rightFoot: wizardRightFoot,
			};
		}
		case "paladin": {
			return {
				leftFoot: paladinLeftFoot,
				rightFoot: paladinRightFoot,
			};
		}
		case "shapeshifter": {
			return {
				leftFoot: shapeshifterLeftFoot,
				rightFoot: shapeshifterRightFoot,
			};
		}
		case "bard": {
			return {
				leftFoot: bardLeftFoot,
				rightFoot: bardRightFoot,
			};
		}
		case "darkKnight": {
			return {
				leftFoot: darkKnightLeftFoot,
				rightFoot: darkKnightRightFoot,
			};
		}
		case "summoner": {
			return {
				leftFoot: summonerLeftFoot,
				rightFoot: summonerRightFoot,
			};
		}
		case "ninja": {
			return {
				leftFoot: ninjaLeftFoot,
				rightFoot: ninjaRightFoot,
			};
		}
		case "dragoon": {
			return {
				leftFoot: dragoonLeftFoot,
				rightFoot: dragoonRightFoot,
			};
		}
		case "sage": {
			return {
				leftFoot: sageLeftFoot,
				rightFoot: sageRightFoot,
			};
		}
		case "spellBow": {
			return {
				leftFoot: spellBowLeftFoot,
				rightFoot: spellBowRightFoot,
			};
		}
		case "dreadKnight": {
			return {
				leftFoot: dreadKnightLeftFoot,
				rightFoot: dreadKnightRightFoot,
			};
		}
		default: {
			return {};
		}
	}
};

const LeftFootMale = ({ leftFoot, stroke }) => (
	<React.Fragment>
		<img src={leftFoot} className={styles.clothing} alt="" />
		<img src={MaleLeftFootHighlight} className={styles.highlight} alt="" />
		<img src={MaleLeftFootShadow} className={styles.shadow} alt="" />
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 -0.5 30 45"
			shapeRendering="crispEdges"
			className={styles.color}
		>
			<path stroke={stroke} d="M19 43h4M19 44h5" />
		</svg>
	</React.Fragment>
);

const RightFootMale = ({ rightFoot, stroke }) => (
	<React.Fragment>
		<img src={rightFoot} className={styles.clothing} alt="" />
		<img src={MaleRightFootHighlight} className={styles.highlight} alt="" />
		<img src={MaleRightFootShadow} className={styles.shadow} alt="" />
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 -0.5 30 45"
			shapeRendering="crispEdges"
			className={styles.color}
		>
			<path stroke={stroke} d="M11 43h4M10 44h5" />
		</svg>
	</React.Fragment>
);

const MaleFeet = ({ mainClass, stroke }) => {
	const classInfo = getClassInfo(mainClass ?? "");
	return (
		<>
			<div className={`${styles.heroFootRight} ${styles.bodyPart}`}>
				<RightFootMale rightFoot={classInfo.rightFoot} stroke={stroke} />
			</div>
			<div className={`${styles.heroFootLeft} ${styles.bodyPart}`}>
				<LeftFootMale leftFoot={classInfo.leftFoot} stroke={stroke} />
			</div>
		</>
	);
};

export default MaleFeet;
